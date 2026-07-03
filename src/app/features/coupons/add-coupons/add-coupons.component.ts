import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCard, MatCardContent, MatCardModule, MatCardTitle } from '@angular/material/card';
import { Plan } from 'src/app/core/models/PlanResponse';
import { DashboardService } from 'src/app/components/dashboard.service';
import { MatNativeDateModule, MatPseudoCheckboxModule } from '@angular/material/core';
import { CouponService } from '../service/coupon.service';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { Package } from 'src/app/core/models/PackageResponse';

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number; // lo convertimos luego
  max_uses: number | null;
  used_count: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string;
  first_purchase_only: number;
  is_active: number;
  created_at: string;

    plans?: {
      id: number;
      name: string;
    }[];
}

@Component({
  selector: 'app-add-coupons',
  standalone: true,
  imports: [
    MatPaginatorModule, MatSortModule, MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule, MatCardModule, MatPseudoCheckboxModule, ReactiveFormsModule, MatCheckboxModule, MatTableModule,
  ],
  templateUrl: './add-coupons.component.html',
  styleUrl: './add-coupons.component.scss',
})



export class AddCouponsComponent {

  @ViewChild('couponDialog')
  couponDialog!: TemplateRef<any>;

  plans: Plan[] = [];
  
  packages : Package [] = [];
  // selectedPlans: number[] = [];

  form: FormGroup;

    tableData : Coupon[] = [];
    dataSource!: MatTableDataSource<Coupon>;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // dataSource = new MatTableDataSource<Coupon>(this.tableData);
    displayedColumns: string[] = [
      'code',
      'plans',
      'discount_type',
      'valid_until',
      'is_active', 
      'actions'
    ];
    

  constructor(  private dialog: MatDialog,  private service: DashboardService,  private fb: FormBuilder ,
                private couponService : CouponService
   ) {
                   this.form = this.fb.group({
                    code: [''],
                    discountType: ['fixed'],
                    discountValue: [null],
                    maxUses: [null],
                    maxUsesPerUser: [null],
                    validFrom: [null],
                    validUntil: [null],
                    firstPurchaseOnly: [false],
                    active: [true],
                    packages: [[]],
                    description: ['']
                  });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit() {
    
    this.getPackages();
    this.getCoupons();
    // this.dataSource = new MatTableDataSource(this.tableData);
    this.dataSource = new MatTableDataSource<Coupon>([]);

  }

  getPackages(){
      this.service.getPackages( ).subscribe ({
      next: (resp: any) => {
      this.packages = resp.data;
      console.log("PAckages => {} ",  this.packages )
     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 

  }

  getPlans(){
    this.service.getPlans( ).subscribe ({
      next: (resp: any) => {
      this.plans = resp.data;
      console.log("PLANS => {} ", resp.data)
     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }
  getPlanNames(coupon: Coupon): string {
    return (coupon as any).plans?.map((p: any) => p.name).join(', ') ?? '';
  }

  getCoupons(){
    this.couponService.getCoupons( ).subscribe ({
      next: (resp: any) => {
      this.tableData = resp.data;
      console.log("COUPONS => {} ", resp.data)

       this.dataSource.data = this.tableData;
     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }

  openCouponModal() {
    this.dialog.open(this.couponDialog, {
      width: '750px',
    });
  }

  saveCoupon() {
     const form = this.form.value;

      const data = {
        code: form.code,
        description: form.description,
        discount_type: form.discountType,
        discount_value: form.discountValue,
        max_uses: form.maxUses,
        max_uses_per_user: form.maxUsesPerUser,
        valid_from: form.validFrom,
        valid_until: form.validUntil,
        first_purchase_only: form.firstPurchaseOnly,
        is_active: form.active,

        package_ids: form.packages
      };

    const errors = this.validateCoupon(form);

    if (errors.length > 0) {
      console.error('Errores de validación:', errors);
      return;
    }
    this.couponService.saveCoupon(data).subscribe({
        next: (res) => {
          console.log('Cupón creado', res);
          
          this.dialog.closeAll();
          this.form.reset({
            discountType: 'fixed',
            active: true,
            firstPurchaseOnly: false,
            plans: []
          });
          return this.showDialog('success', 'Cupon creado', 'Success');
        },
        error: (err) => console.error(err)
      });
  }

  editCoupon(coupon: Coupon) {
  console.log('Editar cupón:', coupon);

  // aquí puedes abrir modal y cargar form
  this.form.patchValue({
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    validUntil: coupon.valid_until,
    active: coupon.is_active === 1
  });

  this.openCouponModal();
}

deleteCoupon(id: number) {
  console.log('Eliminar cupón:', id);

  if (!confirm('¿Seguro que deseas eliminar este cupón?')) return;

  // this.couponService.deleteCoupon(id).subscribe({
  //   next: () => {
  //     this.tableData = this.tableData.filter(c => c.id !== id);
  //     this.dataSource.data = this.tableData;
  //   },
  //   error: (err) => console.error(err)
  // });
}

  showDialog(
      type: 'success' | 'error' | 'info',
      message: string,
      title = 'Aviso'
    ) {
      this.dialog.open(DialogComponent, {
        width: '400px',
        data: {
          type,
          title,
          message,
          confirmText: 'Aceptar'
        }
      });
    }

  private validateCoupon(data: any): string[] {
      const errors: string[] = [];

      // CODE
      if (!data.code || data.code.trim().length < 3) {
        errors.push('El código debe tener al menos 3 caracteres');
      }

      if (data.code && data.code.length > 50) {
        errors.push('El código no puede superar los 50 caracteres');
      }

      // DISCOUNT TYPE
      if (!['fixed'].includes(data.discountType)) {
        errors.push('Tipo de descuento inválido');
      }

      // DISCOUNT VALUE
      if (data.discountValue == null || data.discountValue <= 0) {
        errors.push('El valor del descuento debe ser mayor a 0');
      }

      if (data.discountType === 'percentage' && data.discountValue > 100) {
        errors.push('El porcentaje no puede ser mayor a 100');
      }

      if (data.discountType === 'fixed' && data.discountValue > 999999) {
        errors.push('El monto fijo es demasiado alto');
      }

      // MAX USES
      if (data.maxUses != null && data.maxUses < 1) {
        errors.push('El máximo de usos debe ser mayor a 0');
      }

      // MAX USES PER USER
      if (data.maxUsesPerUser != null && data.maxUsesPerUser < 1) {
        errors.push('El uso por usuario debe ser al menos 1');
      }

      // DATES
      if (data.validFrom && data.validUntil) {
        const from = new Date(data.validFrom);
        const until = new Date(data.validUntil);

        if (until < from) {
          errors.push('La fecha de fin no puede ser menor a la fecha de inicio');
        }
      }

      // FIRST PURCHASE
      if (typeof data.firstPurchaseOnly !== 'boolean') {
        errors.push('firstPurchaseOnly debe ser boolean');
      }

      // ACTIVE
      if (typeof data.active !== 'boolean') {
        errors.push('active debe ser boolean');
      }

      // PLAN IDS
      if (!Array.isArray(data.packages) || data.packages.length === 0) {
        errors.push('Debe seleccionar al menos un plan');
      }

      // DESCRIPTION
      if (data.description && data.description.length > 255) {
        errors.push('La descripción no puede superar 255 caracteres');
      }

      return errors;
    }
}
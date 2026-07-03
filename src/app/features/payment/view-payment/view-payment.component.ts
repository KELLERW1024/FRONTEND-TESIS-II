import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatPseudoCheckboxModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Plan } from 'src/app/core/models/PlanResponse';
import { Coupon } from '../../coupons/add-coupons/add-coupons.component';
import { DashboardService } from 'src/app/components/dashboard.service';
import { PaymentService } from '../service/payment.service';
import { PaymentResponse } from 'src/app/core/models/PaymentResponse';
import { ConversationsPaymentsResponse } from 'src/app/core/models/PaymentsResponse';

@Component({
  selector: 'app-view-payment',
  standalone: true ,
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
  templateUrl: './view-payment.component.html',
  styleUrl: './view-payment.component.scss',
})
export class ViewPaymentComponent {

  @ViewChild('couponDialog') couponDialog !: TemplateRef<any>;

  payments: ConversationsPaymentsResponse[] = [];
  form: FormGroup;

  tableData : ConversationsPaymentsResponse[] = [];
  dataSource!: MatTableDataSource<ConversationsPaymentsResponse>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'user',
    'plan',
    'status',
    'status_payment',
    'acciones'
  ];

  constructor(  private dialog: MatDialog,  private service: DashboardService,  private fb: FormBuilder ,
                private paymentService : PaymentService
   ) {
                   this.form = this.fb.group({
                    code: [''],
                    discountType: ['fixed'],
                   
                  });
  }



   ngOnInit() {
    
    this.getPayments();
    // this.dataSource = new MatTableDataSource(this.tableData);
    // this.dataSource = new MatTableDataSource<Coupon>([]);

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  getPayments(){
    this.paymentService.getPayments( ).subscribe ({
      next: (resp: any) => {
       this.payments = resp.conversations || [];

        if (!this.dataSource) {
          this.dataSource = new MatTableDataSource(this.payments);
        } else {
          this.dataSource.data = this.payments;
        }

        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;

        console.log("PAYMENTS =>", this.payments);
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }

}

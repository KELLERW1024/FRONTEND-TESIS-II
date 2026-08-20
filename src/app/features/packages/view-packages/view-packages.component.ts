import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from 'src/app/components/dashboard.service';

interface Package {
  id: number;
  name: string;
  description?: string;
  duration_months: number;
  local_price: string | number;
  international_price: string | number;
  unit_price: string | number;
  benefits?: string;
  created_at?: string;
  updated_at?: string;
  num_plans: number;
  is_active: number;
}

@Component({
  selector: 'app-view-packages',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
MatDividerModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],

  templateUrl: './view-packages.component.html',
  styleUrl: './view-packages.component.scss',
})
export class ViewPackagesComponent implements OnInit {

  // =========================================================
  // TABLA
  // =========================================================

  packages: Package[] = [];

  dataSource = new MatTableDataSource<Package>([]);

  displayedColumns: string[] = [
    'name',
    'projects',
    'duration',
    'local_price',
    'international_price',
    'unit_price',
    'status',
    'acciones'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  // =========================================================
  // FORMULARIO
  // =========================================================

  packageForm: FormGroup;

  editingPackage: Package | null = null;

  dialogTitle = 'Crear paquete';


  // =========================================================
  // FILTROS
  // =========================================================

  searchValue = '';

  statusFilter = 'all';

  durationFilter = 'all';

  typeFilter = 'all';


  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  totalPackages = 0;

  activePackages = 0;

  inactivePackages = 0;

  totalProjects = 0;


  // =========================================================
  // ESTADOS
  // =========================================================

  loading = false;

  saving = false;


  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service: DashboardService,
  ) {

    this.packageForm = this.fb.group({

      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      description: [''],

      duration_months: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      local_price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      international_price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      unit_price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      num_plans: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      benefits: [''],

      is_active: [1]

    });

  }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.getPackages();

  }


  // =========================================================
  // LISTAR PAQUETES
  // =========================================================

  getPackages(): void {

    this.loading = true;

    /*
     * Aquí posteriormente conectarás:
     *
     * this.packageService.getPackages().subscribe(...)
     *
     * Por ahora se mantiene la estructura preparada.
     */

    this.packages = [];

    this.dataSource.data = this.packages;

    this.loading = false;

    this.updateStatistics();

     this.service.getPackages( ).subscribe ({
      next: (resp: any) => {
      this.packages = resp.data;
      console.log("PAckages => {} ",  this.packages )
      this.dataSource.data= this.packages;
     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 

  }


  // =========================================================
  // CONFIGURAR TABLA
  // =========================================================

  ngAfterViewInit(): void {

    this.dataSource.paginator = this.paginator;

    this.dataSource.sort = this.sort;

  }


  // =========================================================
  // BUSCAR
  // =========================================================

  applyFilter(event: Event): void {

    const value = (event.target as HTMLInputElement)
      .value
      .trim()
      .toLowerCase();

    this.searchValue = value;

    this.applyFilters();

  }


  // =========================================================
  // FILTRO ESTADO
  // =========================================================

  filterByStatus(value: string): void {

    this.statusFilter = value;

    this.applyFilters();

  }


  // =========================================================
  // FILTRO DURACIÓN
  // =========================================================

  filterByDuration(value: string): void {

    this.durationFilter = value;

    this.applyFilters();

  }


  // =========================================================
  // FILTRO TIPO
  // =========================================================

  filterByType(value: string): void {

    this.typeFilter = value;

    this.applyFilters();

  }


  // =========================================================
  // APLICAR TODOS LOS FILTROS
  // =========================================================

  applyFilters(): void {

    let filtered = [...this.packages];


    // -----------------------------------------
    // BUSCADOR
    // -----------------------------------------

    if (this.searchValue) {

      filtered = filtered.filter(pkg => {

        const searchText = `
          ${pkg.name}
          ${pkg.description ?? ''}
          ${pkg.benefits ?? ''}
        `.toLowerCase();

        return searchText.includes(this.searchValue);

      });

    }


    // -----------------------------------------
    // ESTADO
    // -----------------------------------------

    if (this.statusFilter !== 'all') {

      const active = this.statusFilter === 'active';

      filtered = filtered.filter(
        pkg => Number(pkg.is_active) === (active ? 1 : 0)
      );

    }


    // -----------------------------------------
    // DURACIÓN
    // -----------------------------------------

    if (this.durationFilter !== 'all') {

      const duration = Number(this.durationFilter);

      filtered = filtered.filter(
        pkg => Number(pkg.duration_months) === duration
      );

    }


    // -----------------------------------------
    // TIPO
    // -----------------------------------------

    if (this.typeFilter !== 'all') {

      filtered = filtered.filter(pkg =>
        this.getPackageType(pkg) === this.typeFilter
      );

    }


    this.dataSource.data = filtered;

  }


  // =========================================================
  // TIPO DE PAQUETE
  // =========================================================

  getPackageType(pkg: Package): string {

    const projects = Number(pkg.num_plans);

    if (projects >= 50) {
      return 'corporate';
    }

    if (projects === 1) {
      return 'individual';
    }

    if (projects === 2) {
      return 'duo';
    }

    return 'professional';

  }


  // =========================================================
  // CREAR
  // =========================================================

  createPackage(): void {

    this.editingPackage = null;

    this.dialogTitle = 'Crear paquete';

    this.packageForm.reset({

      name: '',

      description: '',

      duration_months: 1,

      local_price: 0,

      international_price: 0,

      unit_price: 0,

      num_plans: 1,

      benefits: '',

      is_active: 1

    });

  }


  // =========================================================
  // EDITAR
  // =========================================================

  editPackage(pkg: Package): void {

    this.editingPackage = pkg;

    this.dialogTitle = 'Editar paquete';

    this.packageForm.patchValue({

      name: pkg.name,

      description: pkg.description ?? '',

      duration_months: pkg.duration_months,

      local_price: pkg.local_price,

      international_price: pkg.international_price,

      unit_price: pkg.unit_price,

      num_plans: pkg.num_plans,

      benefits: pkg.benefits ?? '',

      is_active: pkg.is_active

    });

  }


  // =========================================================
  // GUARDAR
  // =========================================================

  savePackage(): void {

    if (this.packageForm.invalid) {

      this.packageForm.markAllAsTouched();

      return;

    }

    this.saving = true;

    const formValue = this.packageForm.value;


    if (this.editingPackage) {

      // EDITAR

      const index = this.packages.findIndex(
        pkg => pkg.id === this.editingPackage!.id
      );

      if (index !== -1) {

        this.packages[index] = {

          ...this.packages[index],

          ...formValue

        };

      }

    } else {

      // CREAR

      const newPackage: Package = {

        id: Date.now(),

        ...formValue,

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()

      };

      this.packages = [
        ...this.packages,
        newPackage
      ];

    }


    this.dataSource.data = this.packages;

    this.updateStatistics();

    this.applyFilters();

    this.saving = false;

  }


  // =========================================================
  // ACTIVAR / DESACTIVAR
  // =========================================================

  toggleStatus(pkg: Package): void {

    pkg.is_active = Number(pkg.is_active) === 1 ? 0 : 1;

    this.dataSource.data = [...this.packages];

    this.updateStatistics();

    this.applyFilters();

  }


  // =========================================================
  // ACTIVAR
  // =========================================================

  activatePackage(pkg: Package): void {

    pkg.is_active = 1;

    this.dataSource.data = [...this.packages];

    this.updateStatistics();

    this.applyFilters();

  }


  // =========================================================
  // DESACTIVAR
  // =========================================================

  deactivatePackage(pkg: Package): void {

    pkg.is_active = 0;

    this.dataSource.data = [...this.packages];

    this.updateStatistics();

    this.applyFilters();

  }


  // =========================================================
  // DUPLICAR
  // =========================================================

  duplicatePackage(pkg: Package): void {

    const duplicated: Package = {

      ...pkg,

      id: Date.now(),

      name: `${pkg.name} - Copia`,

      is_active: 0,

      created_at: new Date().toISOString(),

      updated_at: new Date().toISOString()

    };

    this.packages = [
      ...this.packages,
      duplicated
    ];

    this.dataSource.data = this.packages;

    this.updateStatistics();

    this.applyFilters();

  }


  // =========================================================
  // VER DETALLE
  // =========================================================

  viewPackage(pkg: Package): void {

    console.log('Ver paquete:', pkg);

  }


  // =========================================================
  // GESTIONAR PLANES
  // =========================================================

  managePlans(pkg: Package): void {

    console.log('Gestionar planes del paquete:', pkg);

  }


  // =========================================================
  // VER SUSCRIPCIONES
  // =========================================================

  viewSubscriptions(pkg: Package): void {

    console.log(
      'Ver suscripciones del paquete:',
      pkg
    );

  }


  // =========================================================
  // VER PAGOS
  // =========================================================

  viewPayments(pkg: Package): void {

    console.log(
      'Ver pagos del paquete:',
      pkg
    );

  }


  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  updateStatistics(): void {

    this.totalPackages = this.packages.length;

    this.activePackages = this.packages.filter(
      pkg => Number(pkg.is_active) === 1
    ).length;

    this.inactivePackages = this.packages.filter(
      pkg => Number(pkg.is_active) === 0
    ).length;

    this.totalProjects = this.packages.reduce(
      (total, pkg) =>
        total + Number(pkg.num_plans || 0),
      0
    );

  }


  // =========================================================
  // FORMATEAR PRECIO
  // =========================================================

  formatPrice(
    value: string | number,
    currency: 'PEN' | 'USD' = 'PEN'
  ): string {

    const amount = Number(value || 0);

    return new Intl.NumberFormat(
      'es-PE',
      {
        style: 'currency',
        currency
      }
    ).format(amount);

  }


  // =========================================================
  // ESTADO
  // =========================================================

  isActive(pkg: Package): boolean {

    return Number(pkg.is_active) === 1;

  }


  // =========================================================
  // DURACIÓN
  // =========================================================

  getDurationLabel(months: number): string {

    if (months === 1) {
      return '1 mes';
    }

    return `${months} meses`;

  }


  // =========================================================
  // REFRESCAR
  // =========================================================

  refresh(): void {

    this.getPackages();

  }

}

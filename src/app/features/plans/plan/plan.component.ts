import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Módulos de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlanService } from '../services/plans.service';

export interface PlanItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  price: number | string;
  duration_days: number;
  max_sections?: number;
  max_messages?: number;
  max_exports?: number;
  billing_cycle?: string;
  is_active: number | boolean;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './plan.component.html'
})
export class PlansComponent implements OnInit {
  private planService = inject(PlanService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  @ViewChild('planDialog') planDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('detailDialog') detailDialog!: TemplateRef<any>;
  selectedPlan: PlanItem | null = null;

  viewPlan(plan: PlanItem): void {
    this.selectedPlan = plan;
    this.dialog.open(this.detailDialog, {
      width: '520px',
      autoFocus: false
    });
  }

  displayedColumns: string[] = ['name', 'code', 'price', 'duration', 'status', 'acciones'];
  dataSource = new MatTableDataSource<PlanItem>([]);
  allPlans: PlanItem[] = [];

  selectedStatus: string = 'all';

  planForm!: FormGroup;
  isEdit: boolean = false;
  selectedPlanId: number | null = null;
  saving: boolean = false;

  ngOnInit(): void {
    this.initForm();
    this.getPlansList();
    this.setupCustomFilter();
  }

  initForm(): void {
    this.planForm = this.fb.group({
      name: ['', [Validators.required]],
      code: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      duration_days: [30, [Validators.required, Validators.min(1)]],
      max_sections: [0],
      max_messages: [0],
      max_exports: [0],
      description: [''],
      is_active: [1]
    });
  }

  getPlansList(): void {
    this.planService.getPlans().subscribe({
      next: (response: any) => {
        const data = response.data || response || [];
        this.allPlans = Array.isArray(data) ? data : [data];
        this.dataSource.data = this.allPlans;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => console.error('Error al obtener planes:', err)
    });
  }

  setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: PlanItem, filter: string) => {
      const search = filter.trim().toLowerCase();
      const name = (data.name || '').toLowerCase();
      const code = (data.code || '').toLowerCase();
      const id = data.id ? data.id.toString() : '';

      return name.includes(search) || code.includes(search) || id.includes(search);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterStatus(status: string): void {
    this.selectedStatus = status;
    this.applyCombinedFilters();
  }

  applyCombinedFilters(): void {
    let filtered = [...this.allPlans];

    if (this.selectedStatus !== 'all') {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(p => (Number(p.is_active) === 1) === isActive);
    }

    this.dataSource.data = filtered;
  }

  openCreateModal(): void {
    this.isEdit = false;
    this.selectedPlanId = null;

    this.planForm.reset({
      price: 0,
      duration_days: 30,
      max_sections: 0,
      max_messages: 0,
      max_exports: 0,
      is_active: 1
    });

    this.dialog.open(this.planDialog, { width: '680px', disableClose: true });
  }

  editPlan(plan: PlanItem): void {
    this.isEdit = true;
    this.selectedPlanId = plan.id;

    this.planForm.patchValue({
      name: plan.name,
      code: plan.code,
      price: plan.price,
      duration_days: plan.duration_days,
      max_sections: plan.max_sections || 0,
      max_messages: plan.max_messages || 0,
      max_exports: plan.max_exports || 0,
      description: plan.description || '',
      is_active: Number(plan.is_active) === 1 ? 1 : 0
    });

    this.dialog.open(this.planDialog, { width: '680px', disableClose: true });
  }

  savePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValues = { ...this.planForm.value };

    if (this.isEdit && this.selectedPlanId) {
      this.planService.updatePlan(this.selectedPlanId, formValues).subscribe({
        next: () => {
          this.saving = false;
          this.dialog.closeAll();
          this.getPlansList();
        },
        error: (err) => {
          console.error('Error al actualizar plan:', err);
          this.saving = false;
        }
      });
    } else {
      this.planService.createPlan(formValues).subscribe({
        next: () => {
          this.saving = false;
          this.dialog.closeAll();
          this.getPlansList();
        },
        error: (err) => {
          console.error('Error al crear plan:', err);
          this.saving = false;
        }
      });
    }
  }

  togglePlanStatus(plan: PlanItem): void {
    if (!plan.id) return;

    this.planService.updatePlanStatus(plan.id).subscribe({
      next: () => {
        plan.is_active = Number(plan.is_active) === 1 ? 0 : 1;
        if (this.selectedStatus !== 'all') {
          this.applyCombinedFilters();
        }
      },
      error: (err) => console.error('Error al cambiar el estado del plan:', err)
    });
  }

  isPlanActive(plan: PlanItem): boolean {
    return Number(plan.is_active) === 1;
  }
}
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

import { TokenUsage, TokenUsageService } from './service/token-usage.service';

@Component({
  selector: 'app-token-usage',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './token-usage.component.html'
})
export class TokenUsageComponent implements OnInit {
  private tokenUsageService = inject(TokenUsageService);
  private destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['user', 'email', 'plan', 'status', 'tokens'];
  rows: TokenUsage[] = [];
  plans: { id: number; name: string }[] = [];
  isLoading = false;

  // Filtros
  search = '';
  selectedPlan: number | 'all' = 'all';
  selectedStatus: 'all' | 'active' | 'expired' = 'all';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Paginación
  pageIndex = 0;
  pageSize = 10;
  total = 0;

  private search$ = new Subject<string>();
  private reload$ = new Subject<void>();

  ngOnInit(): void {
    // Cada recarga cancela la petición anterior, así siempre se muestra la última
    this.reload$
      .pipe(
        switchMap(() => {
          this.isLoading = true;
          return this.tokenUsageService.getTokenUsage({
            search: this.search,
            plan_id: this.selectedPlan === 'all' ? null : this.selectedPlan,
            status: this.selectedStatus === 'all' ? null : this.selectedStatus,
            sort: this.sortDirection,
            page: this.pageIndex + 1,
            per_page: this.pageSize
          }).pipe(
            catchError(err => {
              console.error('Error al cargar el consumo de tokens:', err);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(resp => {
        this.isLoading = false;

        if (resp) {
          this.rows = resp.data || [];
          this.total = resp.meta?.total ?? 0;
        }
      });

    // Esperar a que el usuario deje de escribir antes de buscar
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.search = value;
        this.reloadFromFirstPage();
      });

    this.tokenUsageService.getPlans().subscribe({
      next: (resp: any) => this.plans = resp.data || [],
      error: (err) => console.error('Error al cargar los planes:', err)
    });

    this.reload$.next();
  }

  applyFilter(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value.trim());
  }

  filterPlan(planId: number | 'all'): void {
    this.selectedPlan = planId;
    this.reloadFromFirstPage();
  }

  filterStatus(status: 'all' | 'active' | 'expired'): void {
    this.selectedStatus = status;
    this.reloadFromFirstPage();
  }

  sortTokens(sort: Sort): void {
    this.sortDirection = sort.direction === 'asc' ? 'asc' : 'desc';
    this.reloadFromFirstPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.reload$.next();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa',
      expired: 'Expirada',
      pending: 'Pendiente',
      cancelled: 'Cancelada'
    };
    return labels[status] ?? status;
  }

  private reloadFromFirstPage(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }
}

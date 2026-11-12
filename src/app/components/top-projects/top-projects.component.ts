import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { DashboardService } from '../dashboard.service';

export interface PlanPerformance {
  id: number;
  name: string;
  subscriptions: number;
  revenue: number;
  share: number;
}

// Color fijo por plan
const PLAN_COLORS = ['#539BFF', '#07caa6', '#e39816', '#2bb229d7', '#8B5CF6', '#39d0ee'];

export function planColor(planId: number): string {
  return PLAN_COLORS[(planId - 1) % PLAN_COLORS.length];
}

@Component({
  selector: 'app-top-projects',
  imports: [MaterialModule, CommonModule],
  templateUrl: './top-projects.component.html',
})
export class AppTopProjectsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'subscriptions', 'share', 'revenue'];
  dataSource: PlanPerformance[] = [];

  constructor(private service: DashboardService) {}

  ngOnInit() {
    this.service.getPlanPerformance().subscribe({
      next: (resp: any) => {
        this.dataSource = resp.data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar el rendimiento de planes:', err);
      },
    });
  }

  planColor = planColor;
}

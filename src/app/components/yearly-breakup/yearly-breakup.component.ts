import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DashboardService } from '../dashboard.service';
import { PlanPerformance, planColor } from '../top-projects/top-projects.component';

export interface yearlyChart {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  responsive: ApexResponsive;
}


interface DistributionItem extends PlanPerformance {
  color: string;
}

@Component({
  selector: 'app-yearly-breakup',
  imports: [MaterialModule, NgApexchartsModule, TablerIconsModule, CommonModule],
  templateUrl: './yearly-breakup.component.html',
})
export class AppYearlyBreakupComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public yearlyChart!: Partial<yearlyChart> | any;

  items: DistributionItem[] = [];
  totalRevenue = 0;

  constructor(private service: DashboardService) {
    this.yearlyChart = {
      series: [],
      labels: [],

      chart: {
        type: 'donut',
        fontFamily: "inherit",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 110,
      },
      colors: [],
      plotOptions: {
        pie: {
          startAngle: 0,
          endAngle: 360,
          donut: {
            size: '75%',
            background: 'transparent',
          },
        },
      },
      stroke: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 991,
          options: {
            chart: {
              width: 130,
            },
          },
        },
      ],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        },
      },
    };
  }

  ngOnInit() {
    this.service.getPlanPerformance().subscribe({
      next: (resp: any) => {
        // Solo los planes que han generado ingresos forman parte de la distribución
        const plans: PlanPerformance[] = (resp.data || []).filter((p: PlanPerformance) => p.revenue > 0);

        this.items = plans.map((p) => ({ ...p, color: planColor(p.id) }));
        this.totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);

        this.yearlyChart = {
          ...this.yearlyChart,
          series: this.items.map((p) => p.revenue),
          labels: this.items.map((p) => p.name),
          colors: this.items.map((p) => p.color),
        };
      },
      error: (err: any) => {
        console.error('Error al cargar la distribución de planes:', err);
      },
    });
  }
}

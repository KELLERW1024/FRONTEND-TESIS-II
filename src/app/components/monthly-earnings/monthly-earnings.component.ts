import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexFill,
  ApexXAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DashboardService } from '../dashboard.service';

export interface monthlyChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  fill: ApexFill;
  xaxis: ApexXAxis;
  responsive: ApexResponsive;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-monthly-earnings',
  imports: [NgApexchartsModule, MaterialModule, TablerIconsModule, CommonModule],
  templateUrl: './monthly-earnings.component.html',
})
export class AppMonthlyEarningsComponent implements OnInit {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public monthlyChart!: Partial<monthlyChart> | any;

  year = new Date().getFullYear();
  currentMonthName = MONTHS[new Date().getMonth()];
  currentTotal = 0;
  changePct: number | null = null;

  constructor(private service: DashboardService) {
    this.monthlyChart = {
      chart: {
        id: "sparkline3",
        type: "area",
        height: 80,
        sparkline: {
          enabled: true,
        },
        group: "sparklines",
        fontFamily: "inherit",
        foreColor: "#adb0bb",
      },
      series: [
        {
          name: "Procesado",
          color: "var(--mat-sys-secondary)",
          data: new Array(12).fill(0),
        },
      ],
      xaxis: {
        categories: MONTHS,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 0,
          inverseColors: false,
          opacityFrom: 0.15,
          opacityTo: 0,
          stops: [20, 180],
        },
        opacity: 0.5,
      },

      markers: {
        size: 0,
      },
      tooltip: {
        theme: "dark",
        fixed: {
          enabled: true,
          position: "right",
        },
        x: {
          show: true,
        },
        y: {
          formatter: (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        },
      },
    };
  }

  ngOnInit() {
    this.service.getMonthlyEarnings().subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        this.year = data.year;
        this.currentMonthName = MONTHS[data.current_month - 1];
        this.currentTotal = data.current_total ?? 0;
        this.changePct = data.change_pct ?? null;
        this.monthlyChart.series = [{ ...this.monthlyChart.series[0], data: data.months }];
      },
      error: (err: any) => {
        console.error('Error al cargar las ganancias mensuales:', err);
      },
    });
  }
}

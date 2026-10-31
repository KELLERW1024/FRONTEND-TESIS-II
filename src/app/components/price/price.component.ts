import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Plan } from 'src/app/core/models/PlanResponse';
import { MaterialModule } from 'src/app/material.module';
import { DashboardService } from '../dashboard.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConversationService } from 'src/app/features/conversation/service/conversation.service';
import { Package, PackageResponse } from 'src/app/core/models/PackageResponse';
import { AuthService } from 'src/app/core/services/auth.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexNonAxisChartSeries, ApexResponsive, ApexChart } from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
};

@Component({
  selector: 'app-price',
  standalone: true, 
  imports: [
    MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    TablerIconsModule,
    NgApexchartsModule 
  ],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss',
})
export class PriceComponent {

  isLoading: boolean = true;

  @ViewChild('pricesModal')
  pricesModal!: TemplateRef<any>;
  
  plans: Plan[] = [];
  
  packages : Package [] = [];

  idConversation! : number;

  selectedPlan: any = null;


  totalRevenue: number = 10590;
  totalSales: number = 1320;
  conversionRate: number = 4.38;
  refundRate: number = 1.2;

  public packageChartOptions!: Partial<ChartOptions>; 

   constructor(
    private service: DashboardService, private conversationService: ConversationService , 
    public authService: AuthService,
    private router: Router , 
    private route: ActivatedRoute,
  private dialog: MatDialog
  ) {}
  
ngOnInit() {
  this.getPackages();
  this.loadAdminStats();

  // Configuración inicial del Gráfico de Dona
  this.packageChartOptions = {
    series: [45, 25, 20], 
    chart: {
      type: "donut",
      height: 320,
      fontFamily: 'inherit'
    },
    labels: ["Profesional", "Asesor Senior", "Valiplan Junior"],
    colors: ['#5D87FF', '#49BEFF', '#13DEB9',], 
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: "bottom"
          }
        }
      }
    ]
  };
}

  get isAdmin(): boolean {
  return this.authService.isAdmin();
  }

  // Y creamos este método nuevo abajo:
  loadAdminStats() {
    this.service.getAdminStats().subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        
        // 1. Actualizamos las tarjetas superiores
        this.totalRevenue = data.total_revenue ?? 0;
        this.totalSales = data.total_sales ?? 0;
        this.conversionRate = data.conversion_rate ?? 0;
        this.refundRate = data.refund_rate ?? 0;

        // 2. Actualizamos el Gráfico de Dona con los datos reales del backend
        if (data.chart_paquetes) {
          this.packageChartOptions = {
            ...this.packageChartOptions, 
            series: data.chart_paquetes.series,
            labels: data.chart_paquetes.labels
          };
        }
      },
      error: (err: any) => {
        console.error("Error al cargar estadísticas:", err);
        // ... (tu código de error)
      }
    });
  }



  getPlans(){
    this.service.getPlans( ).subscribe ({
      next: (resp: any) => {
      this.plans = resp.data;

     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }

  getPackages(){
    this.service.getPackages( ).subscribe ({
      next: (resp: any) => {  
        const rawList = resp.data || [];
        // Filtro: solo paquetes activos
        this.packages = rawList.filter((pkg: Package) => Number(pkg.is_active) === 1); 
        //console.log("PAckages => {} ",  this.packages )
     
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }

  openPayment(plan: any) {
    // this.dialog.open(this.pricesModal, {
    //   width: '1200px',
    //   maxWidth: '95vw'
    // });


     this.router.navigate(['/payment', plan.id]);
  }



  pagarPlan() {

    console.log("Pagando:", this.selectedPlan);

    // aquí llamas tu backend de pago
   
        this.conversationService.startConversation( 1 ).subscribe ({
          next: (resp: any) => {
            this.idConversation = resp.conversation_id;

            console.log('DATA START => ',  resp );
            console.log(resp);
             this.router.navigate(['/conversations/edit/', this.idConversation]);

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

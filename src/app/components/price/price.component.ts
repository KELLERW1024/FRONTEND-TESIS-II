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

@Component({
  selector: 'app-price',
  imports: [
    MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    TablerIconsModule,
  ],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss',
})
export class PriceComponent {

  @ViewChild('pricesModal')
  pricesModal!: TemplateRef<any>;
  
  plans: Plan[] = [];
  
  packages : Package [] = [];

  idConversation! : number;

  selectedPlan: any = null;

  pendingPayments: number = 0;
  activeSubscriptions: number = 0;
  totalUsers: number = 0;
  totalProcessed: number = 0;

   constructor(
    private service: DashboardService, private conversationService: ConversationService , 
    private router: Router , 
    private route: ActivatedRoute,
    private dialog: MatDialog,
    public authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  
  ngOnInit() {
    this.getPackages();
    
    // Si es administrador, cargamos las estadísticas del dashboard
    if (this.isAdmin) {
      this.loadAdminStats();
    }
  }

  loadAdminStats() {
    this.service.getAdminStats().subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        this.pendingPayments = data.pending_payments ?? 0;
        this.activeSubscriptions = data.active_subscriptions ?? 0;
        this.totalUsers = data.total_users ?? 0;
        this.totalProcessed = data.total_processed ?? 0;
      },
      error: (err: any) => {
        console.error("Error al cargar estadísticas de admin:", err);
      }
    });
  }

  getPlans(){
    this.service.getPlans( ).subscribe ({
      next: (resp: any) => {
      this.plans = resp.data;
      //console.log("PLANS => {} ", resp.data)
     
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

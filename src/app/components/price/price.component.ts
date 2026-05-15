import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  
  plans: Plan[] = [];

  showModal = false;
  idConversation! : number;

  selectedPlan: any = null;

   constructor(
    private service: DashboardService, private conversationService: ConversationService , 
    private router: Router , 
    private route: ActivatedRoute,
  private dialog: MatDialog
  ) {}
  
  ngOnInit() {
    
    this.getPlans();
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

  openPayment(plan: any) {
    this.selectedPlan = plan;
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.selectedPlan = null;
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

    this.cerrarModal();
  }

}

import {
  Component,
  AfterViewInit,
  OnInit
} from '@angular/core';

import { MatCard, MatCardModule } from '@angular/material/card';
import { DomSanitizer } from '@angular/platform-browser';
import { TablerIconsModule } from 'angular-tabler-icons';

import { environment } from 'src/environments/environment.development';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { Plan } from 'src/app/core/models/PlanResponse';
import { PlanService } from '../plans/services/plans.service';
import { PaymentResponse } from 'src/app/core/models/PaymentResponse';
import { ConversationService } from '../conversation/service/conversation.service';


declare var MercadoPago: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [MatCard, MatCardModule, TablerIconsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {

  idPlan!: number;
  plan!: Plan;

  private brickInitialized = false;

  constructor(
    private sanitizer: DomSanitizer,
    private planService: PlanService,
    private conversationService: ConversationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idPlan = Number(params['planId']);
      this.getPlanId();
    });
  }

  // =========================
  // GET PLAN
  // =========================
  getPlanId() {
    this.planService.getPlanId(this.idPlan).subscribe({
      next: (resp: any) => {
        this.plan = resp;

        console.log('PLAN =>', this.plan);

        // ⚠️ IMPORTANTE: inicializar SOLO cuando exista el plan
        this.initBrick();
      },
      error: (err) => {
        console.error('Error obteniendo plan', err);
      }
    });
  }

  startConversationSuscription(id : number) {
    this.conversationService.startConversation( id ).subscribe({
      next: (resp: any) => {
        // this.plan = resp;

        console.log('startConversationSuscription  =>', resp );
        this.router.navigate([
                      '/conversations',
                      'edit',
                      resp.conversation_id
                  ]);

      },
      error: (err) => {
        console.error('Error en startConversationSuscription : ', err);
      }
    });
  }

  // =========================
  // INIT MERCADOPAGO BRICK
  // =========================
  initBrick() {

    if (this.brickInitialized) return; // evita doble render
    this.brickInitialized = true;

    const mp = new MercadoPago(environment.mpPublicKey, {
      locale: 'es-PE'
    });

    const bricksBuilder = mp.bricks();

    bricksBuilder.create('payment', 'paymentBrick_container', {
      initialization: {
        amount: Number(this.plan.price) // ✅ FIX CRÍTICO
      },

      customization: {
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          ticket: 'all',
          bankTransfer: 'all',
          mercadoPago: 'all'
        }
      },

      callbacks: {

        onReady: () => {
          console.log('Brick listo');
        },

        onSubmit: (formData: any) => {
          console.log('PAYLOAD MP =>', formData);

          // const payload = formData.formData;

          return new Promise((resolve, reject) => {
            this.planService.createPayment( formData ).subscribe({
              next: (resp: PaymentResponse ) => {
                console.log('Pago creado:', resp);
                    console.log('STATUS:', resp.status);

                  if (resp.status === 'approved') {
                    console.log('Pago aprobado 🎉');
                    this.startConversationSuscription(this.idPlan);
                  }

                  if (resp.status === 'rejected') {
                    console.log('Pago rechazado ❌');
                    this.startConversationSuscription(this.idPlan);

                  }

                  resolve(true);
              },
              error: (err) => {
                console.error('Error pago:', err);
                reject(err);
              }
            });
          });
        },

        onError: (error: any) => {
          console.error('Brick error:', error);
        }
      }
    });
  }
}
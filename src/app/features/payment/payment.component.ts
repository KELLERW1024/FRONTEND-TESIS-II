import {
  Component,
  AfterViewInit,
  OnInit,
  ViewChild,
  TemplateRef
} from '@angular/core';

import { MatCard, MatCardModule } from '@angular/material/card';
import { DomSanitizer } from '@angular/platform-browser';
import { provideTablerIcons, TablerIconsModule } from 'angular-tabler-icons';

import { environment } from 'src/environments/environment.development';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogActions, MatDialogContent, MatDialogModule } from '@angular/material/dialog';

import { Plan } from 'src/app/core/models/PlanResponse';
import { PlanService } from '../plans/services/plans.service';
import { PaymentResponse } from 'src/app/core/models/PaymentResponse';
import { ConversationService } from '../conversation/service/conversation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


declare var MercadoPago: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [MatCard, MatCardModule, TablerIconsModule, CommonModule, FormsModule, MatButtonModule
    , MatIconModule, MatDialogContent, ReactiveFormsModule, MatFormFieldModule, MatDialogModule, MatInputModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {

  @ViewChild('yapeDialog')
  yapeDialog!: TemplateRef<any>;

  selectedFileName: string = '';


  form: FormGroup;

  idPlan!: number;
  plan!: Plan;

  private brickInitialized = false;

  //
  showCouponModal = false;
  couponCode = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private sanitizer: DomSanitizer,
    private planService: PlanService,
    private conversationService: ConversationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {

    this.form = this.fb.group({
                    code: [''],
                    numeroOperacion: [null],
                    captura: [''] 
    });
  }

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

  openYapeModal(){
    this.dialog.open(this.yapeDialog, {
      width: '500px',
    });
  }

  openCouponModal() {
    this.showCouponModal = true;
  }

  closeCouponModal() {
    this.showCouponModal = false;
    this.resetMessages();
  }

  applyCoupon() {
    if (!this.couponCode) {
      this.errorMessage = 'Ingresa un cupón válido';
      return;
    }

    if (this.couponCode === 'DESCUENTO10') {
      this.successMessage = 'Cupón aplicado correctamente';
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Cupón inválido';
      this.successMessage = '';
    }
  }

  resetMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      const file = input.files[0];

     this.selectedFileName = file.name;
      console.log(input.files[0]);
    }
  }
}
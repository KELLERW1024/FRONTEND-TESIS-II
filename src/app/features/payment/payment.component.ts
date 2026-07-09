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
import { CouponService } from '../coupons/service/coupon.service';
import { PaymentService } from './service/payment.service';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { Package, PackageResponse } from 'src/app/core/models/PackageResponse';


declare var MercadoPago: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [MatCard, MatOption, MatSelect,  MatCheckbox,  MatCardModule, TablerIconsModule, CommonModule, FormsModule, MatButtonModule
    , MatIconModule, MatDialogContent, ReactiveFormsModule, MatFormFieldModule, MatDialogModule, MatInputModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {

  @ViewChild('yapeDialog')
  yapeDialog!: TemplateRef<any>;

  @ViewChild('couponDialog') couponDialog !: TemplateRef<any>;

  selectedFileName: string = '';
  selectedFile: File | null = null;

  form: FormGroup;
  formCoupon: FormGroup;

  idPackage!: number;
  numPlanPackage : number = 0 ;
  plans: Plan [] =[] ;
  plan!: Plan;

  package : Package | null = null;

  selectedPlans: number[] = [];

  private brickInitialized = false;

  //
  // showCouponModal = false;
  // couponCode = '';
  // errorMessage = '';
  // successMessage = '';
  couponApplied: any = null;
  discountAmount: number = 0;
  finalAmount: number = 0;
  originalPrice: number = 0;
  isCouponApplied: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private planService: PlanService,
    private conversationService: ConversationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private paymentService: PaymentService
  ) {

    this.form = this.fb.group({
                    codeSecurity: [''],
                    numberOperation: [null],
                    captura: [''] 
    });

    this.formCoupon = this.fb.group({
                    code: [''],           
    });

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idPackage = Number(params['packageId']);
      this.getPackagePlans();
    });
  }
  trackByIndex(index: number): number {
    return index;
  }

  // =========================
  // GET PLAN
  // =========================
  getPackagePlans() {
    console.log('ID PACKAGE  =>', this.idPackage);
    this.planService.getPackagePlans(this.idPackage).subscribe({
      next: (resp: any) => {
        console.log('PPP =>', resp);
        this.package = resp.data;
        console.log('PACAKAGE =>', this.package );


        this.numPlanPackage = resp.data.num_plans;

        this.plans = resp.data.plans;

        console.log('PLANS =>', this.plans);
        // this.originalPrice = this.plan.price;
        // crear array con N selects
        this.selectedPlans = Array(this.numPlanPackage).fill(null);

        // ⚠️ IMPORTANTE: inicializar SOLO cuando exista el plan
        this.initBrick();
      },
      error: (err) => {
        console.error('Error obteniendo plan', err);
      }
    });
  }
  // getPlanId() {
  //   this.planService.getPlanId(this.idPlan).subscribe({
  //     next: (resp: any) => {
  //       this.plan = resp;

  //       console.log('PLAN =>', this.plan);
  //       this.originalPrice = this.plan.price;

  //       // ⚠️ IMPORTANTE: inicializar SOLO cuando exista el plan
  //       this.initBrick();
  //     },
  //     error: (err) => {
  //       console.error('Error obteniendo plan', err);
  //     }
  //   });
  // }

  aplicarCupon(){
    const code = this.formCoupon.get('code')?.value?.trim();

    if (!code) {
      alert('Ingrese un código de cupón');
      return;
    }

      this.paymentService.validateCoupon(code, this.idPackage)
      .subscribe({
          next: (response) => {
            console.log("RESPONSE : ", response)

                this.couponApplied = response.coupon;
                this.discountAmount = response.discount_amount;
                this.finalAmount = Math.round(response.final_amount * 100) / 100;
                this.originalPrice = response.price;

                this.isCouponApplied = true;
                this.dialog.closeAll();
                return this.showDialog('success', 'Cupon descuento realizado', 'Success');
              },
              error: (error) => {
                this.couponApplied = null;
                this.discountAmount = 0;
                this.finalAmount = this.plan?.price;
                this.isCouponApplied = false;

                // alert(error.error?.message || 'No se pudo validar el cupón');
                return this.showDialog('error', error.error?.message || 'No se pudo validar el cupón' , 'Error');
              }
      });
  }

  // startConversationSuscription(id : number) {
  //   this.conversationService.startConversation( id ).subscribe({
  //     next: (resp: any) => {
  //       // this.plan = resp;

  //       console.log('startConversationSuscription  =>', resp );
  //       this.router.navigate([
  //                     '/conversations',
  //                     'edit',
  //                     resp.conversation_id
  //                 ]);

  //     },
  //     error: (err) => {
  //       console.error('Error en startConversationSuscription : ', err);
  //     }
  //   });
  // }
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
        amount: Number( 100 ) // ✅ FIX CRÍTICO
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

          const payload : any ={
            ...formData,
            coupon_code: this.couponApplied ? this.couponApplied.code : null ,
            discount_amount: this.couponApplied ?  this.discountAmount.toString(): null ,
            original_price: this.couponApplied ? this.originalPrice.toString(): null ,
            final_amount : this.couponApplied ? this.finalAmount.toString() : null ,
            package_id :  this.idPackage.toString() ,

          };
         
          console.log('PAYLOAD MP =>', payload);

          // const payload = formData.formData;

          return new Promise((resolve, reject) => {
            this.planService.createPayment( payload ).subscribe({
              next: (resp: PaymentResponse ) => {
                console.log('Pago creado:', resp);
                    console.log('STATUS:', resp.status);

                  if (resp.status === 'approved') {
                    console.log('Pago aprobado 🎉');
                    // this.startConversationSuscription(this.idPlan);
                  }

                  if (resp.status === 'rejected') {
                    console.log('Pago rechazado ❌');
                    // this.startConversationSuscription(this.idPlan);

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

  obtenerFree() {

    console.log("planes sep;ccionados" + this.selectedPlans.length );

    if (this.selectedPlans.some(planId => !planId)) {
      this.showDialog(
          'info',
          'Debe seleccionar al menos un plan.',
          'OK'
        );
      return;
    }

    const data = {
      package_id: this.idPackage,
      plans :  this.selectedPlans
    };

    console.log(" PACKAGE : " + this.idPackage );
    this.paymentService.registerFree( data )
      .subscribe({
        next: (resp: any) => {

          this.dialog.closeAll();

          this.showDialog(
            'success',
            'Su suscripcion free a sido exitosa',
            'OK'
          );

        },
        error: (err) => {

          this.showDialog(
            'error',
            err.error?.message || 'No se pudo completar la suscripcion',
            'Error'
          );

        }
      });
  }

  realizarPagoYape() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Validar 
    if (this.selectedPlans.some(planId => !planId)) {
      this.showDialog(
        'info',
        'Debe seleccionar un plan en todos los campos.',
        'OK'
      );
      return;
    }

    const formData = new FormData();

    formData.append('package_id', this.idPackage.toString());

    this.selectedPlans.forEach(planId => {
        formData.append('plans[]', planId.toString());
      });

    formData.append(
      'security_code',
      this.form.get('codeSecurity')?.value
    );

    formData.append(
      'operation_number',
      this.form.get('numberOperation')?.value
    );

    if (this.couponApplied) {
      formData.append('coupon_code', this.couponApplied.code);
    }
    if (this.couponApplied) {
      formData.append('discount_amount', this.discountAmount.toString() );
    }
    if (this.couponApplied) {
      formData.append('original_price', this.originalPrice.toString() );
    }

    if (this.couponApplied) {
      formData.append('final_amount', this.finalAmount.toString() );
    }

    if (this.selectedFile) {
      formData.append('voucher', this.selectedFile);
    }

    // if ( this.isCouponApplied ){
    //   formData.append('id_coupon', this.couponApplied.id );
    // }

    this.paymentService.registerYapePayment(formData)
      .subscribe({
        next: (resp: any) => {

          this.dialog.closeAll();

          this.showDialog(
            'success',
            'Tu pago fue registrado correctamente. Será validado dentro de las próximas horas.',
            'Pago registrado'
          );

        },
        error: (err) => {

          this.showDialog(
            'error',
            err.error?.message || 'No se pudo registrar el pago',
            'Error'
          );

        }
      });
  }

  openYapeModal(){
    this.dialog.open(this.yapeDialog, {
      width: '500px',
    });
  }

  openCouponModal() {
    console.log("ID PLANS SLECTS {} " , this.selectedPlans);

    this.dialog.open(this.couponDialog, {
      width: '300px',
    });
  }

  // closeCouponModal() {
  //   this.showCouponModal = false;
  //   this.resetMessages();
  // }

  // applyCoupon() {
  //   if (!this.couponCode) {
  //     this.errorMessage = 'Ingresa un cupón válido';
  //     return;
  //   }

  //   if (this.couponCode === 'DESCUENTO10') {
  //     this.successMessage = 'Cupón aplicado correctamente';
  //     this.errorMessage = '';
  //   } else {
  //     this.errorMessage = 'Cupón inválido';
  //     this.successMessage = '';
  //   }
  // }

  // resetMessages() {
  //   this.errorMessage = '';
  //   this.successMessage = '';
  // }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      const file = input.files[0];

      this.selectedFile = input.files[0];

      this.selectedFileName = file.name;
      console.log(input.files[0]);
    }
  }

  showDialog(
      type: 'success' | 'error' | 'info',
      message: string,
      title = 'Aviso'
    ) {
      this.dialog.open(DialogComponent, {
        width: '400px',
        data: {
          type,
          title,
          message,
          confirmText: 'Aceptar'
        }
      });
  }
}
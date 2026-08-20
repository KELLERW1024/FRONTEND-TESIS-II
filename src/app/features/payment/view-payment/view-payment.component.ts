import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatNativeDateModule,
  MatPseudoCheckboxModule
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginator,
  MatPaginatorModule
} from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import {
  MatSort,
  MatSortModule
} from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';

import { DashboardService } from 'src/app/components/dashboard.service';
import { PaymentService } from '../service/payment.service';
import {
  ConversationsPaymentsResponse
} from 'src/app/core/models/PaymentsResponse';

@Component({
  selector: 'app-view-payment',
  standalone: true,

  imports: [
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatPseudoCheckboxModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatTableModule,
    MatMenuModule
  ],

  templateUrl: './view-payment.component.html',
  styleUrl: './view-payment.component.scss',
})
export class ViewPaymentComponent {

  @ViewChild('couponDialog')
  couponDialog!: TemplateRef<any>;

  payments: ConversationsPaymentsResponse[] = [];

  form: FormGroup;

  tableData: ConversationsPaymentsResponse[] = [];

  dataSource!: MatTableDataSource<ConversationsPaymentsResponse>;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;


  // =====================================================
  // COLUMNAS
  // =====================================================

  displayedColumns: string[] = [
    'user',
    'plan',
    'status',
    'status_payment',
    'payment_method',
    'amount',
    'operation',
    'acciones'
  ];


  // =====================================================
  // FILTROS
  // =====================================================

  selectedPaymentMethod: string = 'all';

  selectedStatus: string = 'all';


  constructor(
    private dialog: MatDialog,
    private service: DashboardService,
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {

    this.form = this.fb.group({
      code: [''],
      discountType: ['fixed'],
    });

  }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit() {

    this.getPayments();

  }


  // =====================================================
  // BUSCADOR
  // =====================================================

  applyFilter(event: Event) {

    const filterValue =
      (event.target as HTMLInputElement).value;

    if (!this.dataSource) {
      return;
    }

    this.dataSource.filter =
      filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

  }


  // =====================================================
  // FILTRO MEDIO DE PAGO
  // =====================================================

  filterPaymentMethod(value: string) {

    this.selectedPaymentMethod = value;

    this.applyCustomFilter();

  }


  // =====================================================
  // FILTRO ESTADO
  // =====================================================

  filterStatus(value: string) {

    this.selectedStatus = value;

    this.applyCustomFilter();

  }


  // =====================================================
  // FILTRO GENERAL
  // =====================================================

  private applyCustomFilter() {

    if (!this.dataSource) {
      return;
    }

    this.dataSource.filterPredicate =
      (conversation: ConversationsPaymentsResponse, filter: string) => {

        const data = conversation as any;

        const search =
          filter?.trim().toLowerCase() || '';

        // ==========================================
        // BÚSQUEDA
        // ==========================================

        const userName =
          data.user?.name?.toLowerCase() || '';

        const userLastName =
          data.user?.last_name?.toLowerCase() || '';

        const userEmail =
          data.user?.email?.toLowerCase() || '';

        const plan =
          data.plan_name?.toLowerCase() || '';

        const operation =
          data.operation_number?.toLowerCase() || '';

        const provider =
          data.payment_provider?.toLowerCase() || '';

        const currency =
          data.currency?.toLowerCase() || '';

        const amount =
          String(
            data.final_amount ??
            data.amount ??
            ''
          ).toLowerCase();

        const paymentStatuses =
          (data.payments || [])
            .map((payment: any) =>
              payment.status?.toLowerCase() || ''
            )
            .join(' ');


        const searchableText = [
          userName,
          userLastName,
          userEmail,
          plan,
          operation,
          provider,
          currency,
          amount,
          paymentStatuses
        ].join(' ');


        const matchesSearch =
          !search ||
          searchableText.includes(search);


        // ==========================================
        // FILTRO MEDIO DE PAGO
        // ==========================================

        let matchesPaymentMethod = true;

        if (
          this.selectedPaymentMethod !== 'all'
        ) {

          const providerNormalized =
            provider
              .replace(/\s/g, '')
              .toLowerCase();

          if (
            this.selectedPaymentMethod === 'yape'
          ) {

            matchesPaymentMethod =
              providerNormalized.includes('yape');

          }

          if (
            this.selectedPaymentMethod === 'mercadopago'
          ) {

            matchesPaymentMethod =
              providerNormalized.includes('mercadopago') ||
              providerNormalized.includes('mercado');

          }

        }


        // ==========================================
        // FILTRO ESTADO
        // ==========================================

        let matchesStatus = true;

        if (
          this.selectedStatus !== 'all'
        ) {

          const subscriptionStatus =
            data.status?.toLowerCase() || '';

          const paymentStatus =
            (data.payments || [])
              .some(
                (payment: any) =>
                  payment.status?.toLowerCase() ===
                  this.selectedStatus
              );

          matchesStatus =
            subscriptionStatus ===
              this.selectedStatus ||
            paymentStatus;

        }


        return (
          matchesSearch &&
          matchesPaymentMethod &&
          matchesStatus
        );

      };


    // Aplicamos nuevamente el filtro actual
    this.dataSource.filter =
      this.dataSource.filter || ' ';


    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

  }


  // =====================================================
  // PAGINADOR + SORT
  // =====================================================

  ngAfterViewInit() {

    if (this.dataSource) {

      this.dataSource.paginator =
        this.paginator;

      this.dataSource.sort =
        this.sort;

    }

  }


  // =====================================================
  // CONFIGURACIÓN DEL SORT
  // =====================================================

  private configureTable() {

    if (!this.dataSource) {
      return;
    }


    this.dataSource.sortingDataAccessor =
      (item: ConversationsPaymentsResponse, property: string) => {

        const data = item as any;

        switch (property) {

          case 'user':
            return (
              data.user?.name ||
              ''
            ).toLowerCase();


          case 'plan':
            return (
              data.plan_name ||
              ''
            ).toLowerCase();


          case 'status':
            return (
              data.status ||
              ''
            ).toLowerCase();


          case 'payment_method':
            return (
              data.payment_provider ||
              ''
            ).toLowerCase();


          case 'amount':
            return Number(
              data.final_amount ??
              data.amount ??
              0
            );


          case 'operation':
            return (
              data.operation_number ||
              ''
            ).toLowerCase();


          case 'status_payment':

            return (
              data.payments?.[0]?.status ||
              ''
            ).toLowerCase();


          default:
            return '';

        }

      };


    this.dataSource.paginator =
      this.paginator;

    this.dataSource.sort =
      this.sort;

  }


  // =====================================================
  // OBTENER PAGOS
  // =====================================================

  getPayments() {

    this.paymentService.getPayments().subscribe({

      next: (resp: any) => {

        this.payments =
          resp.conversations || [];


        this.tableData =
          this.payments;


        if (!this.dataSource) {

          this.dataSource =
            new MatTableDataSource(
              this.payments
            );

        } else {

          this.dataSource.data =
            this.payments;

        }


        // Configuración de filtros
        this.configureTable();


        // Aplicar filtro personalizado
        this.applyCustomFilter();


        console.log(
          'PAYMENTS =>',
          this.payments
        );

      },


      error: (err: any) => {

        console.error(err);

      },


      complete: () => {

        console.log(
          'Completado'
        );

      }

    });

  }


  // =====================================================
  // ACTUALIZAR
  // =====================================================

  refreshPayments() {

    this.getPayments();

  }

  // Ver detalle del pago
verDetalle(conversation: ConversationsPaymentsResponse): void {
  console.log('Ver detalle:', conversation);
}


// Ver comprobante
verComprobante(conversation: ConversationsPaymentsResponse): void {
  console.log('Ver comprobante:', conversation);

  const payment: any = (conversation as any).payments?.[0];

  const voucherPath =
    payment?.voucher_path ||
    (conversation as any).voucher_path;

  if (voucherPath) {
    window.open(voucherPath, '_blank');
  } else {
    console.warn('El pago no tiene comprobante.');
  }
}


// Validar pago
validarPago(conversation: ConversationsPaymentsResponse): void {
  console.log('Validar pago:', conversation);

  // Aquí posteriormente conectarás el endpoint
  // para cambiar el estado del pago a "completed"
  // y activar la suscripción.
}


// Rechazar pago
rechazarPago(conversation: ConversationsPaymentsResponse): void {
  console.log('Rechazar pago:', conversation);

  // Aquí posteriormente conectarás el endpoint
  // para cambiar el estado del pago a "failed".
}


}

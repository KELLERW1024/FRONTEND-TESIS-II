import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ConversationService } from '../service/conversation.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';

export type ConversationStatus = 'active' | 'completed' | 'archived';

export interface ApiResponse {
  user: User;
  conversations: Conversation[];
}

export interface User {
  id: number;
  name: string;
}

export interface Conversation {
  id: number;
  status: ConversationStatus;
  title: string;
  plan_name: string;
  package_name: string;
}

@Component({
  selector: 'app-conversation',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, 
    MatCard, 
    TablerIconsModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss',
})
export class ConversationComponent {
//dataSource1 = PRODUCT_DATA;
//displayedColumns1: string[] = ['assigned', 'name', 'priority', 'budget'];

@ViewChild('editDialog') editDialog!: TemplateRef<any>;
@ViewChild(MatPaginator) paginator!: MatPaginator;
@ViewChild(MatSort) sort!: MatSort;

  displayedColumns1: string[] = ['paquete', 'plan', 'title', 'status', 'paymentstatus' , 'actions'];

  dataSource1 = new MatTableDataSource<Conversation>([]);

  conversations: Conversation[] = [];

  searchValue: string = '';

  statusFilter: string = 'all';

  paymentStatusFilter: string = 'all';

  userName: string = '';

  loading = false;

  newTitle = '';

  selectedConversation: any;

  constructor(private router: Router, private conversationService : ConversationService,  public dialog: MatDialog ) {}

  ngAfterViewInit(): void {
    this.dataSource1.paginator = this.paginator;
    this.dataSource1.sort = this.sort;
  }
  
  ngOnInit(): void {
     this.getConversations();
  }

  getConversations(): void {

    this.loading = true;

    this.conversationService.getSuscriptions()
      .subscribe({

        next: (resp: ApiResponse) => {

          console.log(resp);

          this.userName = resp.user.name;

          this.conversations = resp.conversations || [];

          this.applyFilters();

          this.loading = false;
        },

        error: (err) => {

          console.error(err);

          this.loading = false;
        }

      });

  }
  openEditNameConversation(conversation: any) {

    this.selectedConversation = conversation;
    this.newTitle = conversation.title;

    this.dialog.open(this.editDialog, {
      width: '500px'
    });

  }
  editConversation( idConversation: number ){

     this.conversationService.getVerficationDiagnosticExist( idConversation )
      .subscribe({
        next: (resp: any ) => {
          console.log(resp);

          // [routerLink]="['/conversations/edit', element.id]"
          // 1. Si no ha llenado el diagnóstico inicial, va al diagnóstico
          if (!resp.exists || resp.summary == null) {
            this.router.navigate(['/conversations/question-diagnostic-type', idConversation]);
            return;
          }

          // 2. Si ya completó el diagnóstico pero status_structure sigue en 0, va a la estructura
          if (Number(resp.status_structure) === 0) {
            this.router.navigate(['/conversations/structure', idConversation]);
            return;
          }

          // 3. Si ya completó diagnóstico y estructura (status_structure === 1), va a desarrollar el plan
          this.router.navigate(['/conversations/edit', idConversation]);
        },

        error: (err) => {

          console.error(err);
          this.loading = false;
        }
      });
    
  }

  updateNameConversation() {
    
    const data = {
      id: this.selectedConversation.id,
      title: this.newTitle
    };

    this.conversationService.updateTitleConversation(data)
      .subscribe({
        next: (resp: any) => {

          // actualizar UI local
          this.selectedConversation.title = this.newTitle;

          this.dialog.closeAll();
        },

        error: (err) => {
          console.error(err);

            if (err.status === 422) {
              console.log('Errores de validación', err.error.errors);
            }

            if (err.status === 500) {
              console.log('Error del servidor', err.error.message);
            }

            this.loading = false;
        }
      });
}

  // =========================================================
  // FILTROS
  // =========================================================

  applyFilter(event: Event): void {
    this.searchValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  filterByStatus(value: string): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  filterByPaymentStatus(value: string): void {
    this.paymentStatusFilter = value;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.conversations];

    // Búsqueda por texto
    if (this.searchValue) {
      filtered = filtered.filter(item => {
        const text = `
          ${item.title ?? ''}
          ${item.package_name ?? ''}
          ${item.plan_name ?? ''}
        `.toLowerCase();
        return text.includes(this.searchValue);
      });
    }

    if (this.statusFilter !== 'all') {
      const wantActive = this.statusFilter === 'active';
      filtered = filtered.filter(item => (item as any).package_is_active === wantActive);
    }

    if (this.paymentStatusFilter !== 'all') {
      filtered = filtered.filter(item => (item as any).payment_status === this.paymentStatusFilter);
    }

    this.dataSource1.data = filtered;

    if (this.dataSource1.paginator) {
      this.dataSource1.paginator.firstPage();
    }
  }
  
  // =========================================================
  // VALIDACIÓN ESTADO DE PAGO
  // =========================================================
  isPaymentApproved(element: any): boolean {
    const status = element?.payment_status?.toLowerCase();
    return status === 'completed' || status === 'paid';
  }
}

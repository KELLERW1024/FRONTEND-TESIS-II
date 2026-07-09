import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
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
    RouterLink, MatCard
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss',
})
export class ConversationComponent {
//dataSource1 = PRODUCT_DATA;
//displayedColumns1: string[] = ['assigned', 'name', 'priority', 'budget'];

@ViewChild('editDialog') editDialog!: TemplateRef<any>;

  displayedColumns1: string[] = ['paquete', 'plan', 'title', 'status', 'actions'];

  dataSource1 = new MatTableDataSource<Conversation>([]);

  userName: string = '';

  loading = false;

  newTitle = '';
selectedConversation: any;

  constructor(private router: Router, private conversationService : ConversationService,  public dialog: MatDialog ) {}

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

          this.dataSource1.data = resp.conversations;

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
  

}

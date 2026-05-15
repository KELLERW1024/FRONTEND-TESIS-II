import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ConversationService } from '../service/conversation.service';

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
}

// table 1
// export interface productsData {
//   id: number;
//   imagePath: string;
//   uname: string;
//   budget: number;
//   priority: string;
// }

// const PRODUCT_DATA: productsData[] = [
//   {
//     id: 1,
//     imagePath: 'assets/images/products/product-1.jpg',
//     uname: 'Gaming Console',
//     budget: 180,
//     priority: 'confirmed',
//   },
//   {
//     id: 2,
//     imagePath: 'assets/images/products/product-2.jpg',
//     uname: 'Leather Purse',
//     budget: 90,
//     priority: 'cancelled',
//   },
//   {
//     id: 3,
//     imagePath: 'assets/images/products/product-3.jpg',
//     uname: 'Red Velvate Dress',
//     budget: 120,
//     priority: 'rejected',
//   },
//   {
//     id: 4,
//     imagePath: 'assets/images/products/product-4.jpg',
//     uname: 'Headphone Boat',
//     budget: 160,
//     priority: 'confirmed',
//   },
// ];

@Component({
  selector: 'app-conversation',
  imports: [
    MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss',
})
export class ConversationComponent {
//dataSource1 = PRODUCT_DATA;
//displayedColumns1: string[] = ['assigned', 'name', 'priority', 'budget'];

  displayedColumns1: string[] = ['plan', 'title', 'status', 'actions'];

  dataSource1 = new MatTableDataSource<Conversation>([]);

  userName: string = '';

  loading = false;

  constructor(private router: Router, private conversationService : ConversationService ) {}

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
  

}

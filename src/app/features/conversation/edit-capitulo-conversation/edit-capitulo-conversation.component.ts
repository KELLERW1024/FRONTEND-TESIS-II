import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Plan, Section } from 'src/app/core/models/PlanResponse';
import { MaterialModule } from 'src/app/material.module';
import { ConversationService } from '../service/conversation.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-capitulo-conversation',
  imports: [MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, 	MatExpansionModule, TablerIconsModule, MatCardModule, MatRadioModule, FormsModule, MatCheckboxModule, MatSlideToggleModule],
  templateUrl: './edit-capitulo-conversation.component.html',
  styleUrl: './edit-capitulo-conversation.component.scss',
})
export class EditCapituloConversationComponent {

  checked = false;
  disabled = false;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  idSuscriptionConversation!: number;
    plan!: Plan;
    sections: Section[] = [];

    showModal = false;
selectedQuestion: any;
    

    constructor( 
    private router: Router , private route: ActivatedRoute, private conversationService: ConversationService,
    private dialog: MatDialog
     ) {}


  ngOnInit() {

    
    this.route.params.subscribe(params => {
      this.idSuscriptionConversation = params['id'];
      //this.addConversation();
    });

    console.log("ONIT => " + this.idSuscriptionConversation)
    
    this.obtenerDataConversation();
    // this.addConversation();
  }
  deleteAnswer() {
    console.log('Eliminar:', this.selectedQuestion);

    // llamada API aquí
    // this.service.deleteAnswer(this.selectedQuestion.id)

    this.showModal = false;
  }

  obtenerDataConversation(){

    console.log("Suscription => obtenerDataConversation "   )

    this.conversationService.getConversationPlanUser ( this.idSuscriptionConversation ).subscribe ({
      next: (resp: any) => {
      console.log('Conversation => ',  resp);
      this.plan = resp.data.plan;
      this.sections = this.plan.sections ;

     
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

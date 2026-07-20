import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ConversationService } from '../service/conversation.service';
import { FileQuestion, Plan, Section } from 'src/app/core/models/PlanResponse';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';

import { Location } from '@angular/common';


@Component({
  selector: 'app-view-conversation',
  providers: [provideNativeDateAdapter()],
  imports: [MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, 	MatExpansionModule, TablerIconsModule],
  templateUrl: './view-conversation.component.html',
  styleUrl: './view-conversation.component.scss',
})
export class ViewConversationComponent {

  	@ViewChild(MatAccordion) accordion: MatAccordion;

    idSuscriptionConversation!: number;
    plan!: Plan;
    sections: Section[] = [];

    

    constructor(  private location: Location,
    private router: Router , private route: ActivatedRoute, private conversationService: ConversationService,
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

  goBack(): void {
    this.location.back();
  }

  obtenerDataConversation(){

    console.log("Suscription => obtenerDataConversation "   )

    this.conversationService.getConversationPlanUser ( this.idSuscriptionConversation ).subscribe ({
      next: (resp: any) => {
      console.log('Conversation => ',  resp);
      this.plan = resp.data.plan;
      this.sections = this.plan.sections ;


      // Numerar imágenes
      let contadorImagen = 1;

      this.sections.forEach(section => {
        section.questions.forEach(question => {

          if (question.files?.length) {
            question.files.forEach( (file: FileQuestion ) => {
              
              if (file.file_type === 'image') {
                file.numero = contadorImagen++;
              }

            });
          }

        });
      });

       // Numerar tablas
        let contadorTabla = 1;

        this.sections.forEach(section => {
          section.questions.forEach(question => {

            if (question.tables?.length) {
              question.tables.forEach( (table: any) => {
                table.numero = contadorTabla++;
              });
            }

          });
        });

     
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

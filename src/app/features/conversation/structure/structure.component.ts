import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Plan, Section } from 'src/app/core/models/PlanResponse';
import { ConversationService } from '../service/conversation.service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MaterialModule } from 'src/app/material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { TablerIconsModule } from 'angular-tabler-icons';

import { Location } from '@angular/common';

@Component({
  selector: 'app-structure',
  imports: [MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, 	MatExpansionModule, TablerIconsModule ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
})
export class StructureComponent {

   idSuscriptionConversation!: number;
    plan!: Plan;
    sections: Section[] = [];
    

    constructor( private location: Location,
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

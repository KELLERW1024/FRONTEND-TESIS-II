import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { Section } from 'src/app/core/models/Section';
import { MaterialModule } from 'src/app/material.module';
import { ConversationService } from '../service/conversation.service';
import { Plan, Question, Section } from 'src/app/core/models/PlanResponse';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnswerValidationResponse } from 'src/app/core/models/ValidarRespuestaResponse';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-conversation',
  imports: [ MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule],
  templateUrl: './edit-conversation.component.html',
  styleUrl: './edit-conversation.component.scss',
})
export class EditConversationComponent {

  idSuscriptionConversation!: number;
  idPlan!: number;
  idConversation!: number; 
  plan!: Plan;
  sections: Section[] = [];

  sectionProgress: Section | null = null;
  questions: Question[] = [];
  currentQuestion!: Question | null;
  answers: string[] = [];

  // answerText: string = '';

  reply : string = "";
  validationResponse : AnswerValidationResponse | null;

  finalizado : boolean = false;

  selectedQuestion: any = null;
  showModal = false;

  form!: FormGroup;

  constructor(
    private conversationService: ConversationService,
    private router: Router , 
    private route: ActivatedRoute, private fb: FormBuilder, private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
    answer: ['']
  });
    
    this.finalizado = false;
    this.route.params.subscribe(params => {
      this.idSuscriptionConversation = params['id'];
      //this.addConversation();
    });

    console.log("ONIT => " + this.idSuscriptionConversation)
    
    this.obtenerDataConversation();
    // this.addConversation();
  }
    verDetalle(question: any) {
    this.selectedQuestion = question;
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  // addConversation(){
  //   this.conversationService.startConversation( 1 ).subscribe ({
  //     next: (resp: any) => {
  //       this.idConversation = resp.conversation_id;

  //       console.log('DATA START => ',  resp );
  //       console.log(resp);

  //     },
  //     error: (err: any) => {
  //       console.error(err);
  //     },
  //     complete: () => {
  //       console.log('Completado');
  //     }
  //   }) 
  // }
  obtenerDataConversation(){
    console.log("Suscription => obtenerDataConversation "   )
    this.conversationService.getDataConversation( this.idSuscriptionConversation ).subscribe ({
      next: (resp: any) => {
      this.plan = resp.data.plan;
      console.log('PLAN RESP ',  resp);

      this.sections = this.plan.sections ;
      console.log('Sections => ',  this.sections);

      this.sectionProgress = this.sections.find(
          (s: any) => !s.answer_section
        ) || null;

      console.log('Section => ',  this.sectionProgress );

      this.questions = this.sectionProgress?.questions ?? [];
      this.currentQuestion =  this.questions.find(q => q.answer_question === null) ?? null;

      console.log(" QUESTION CURRENT => {}" , this.currentQuestion);

      this.finalizado = this.sections.every((s: any) => !!s.answer);
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }

  validarRespuesta(){
    const payloadRespuesta =  { 
        pregunta : this.currentQuestion?.text ,
        detail : this.currentQuestion?.detail ,
        evidence : this.currentQuestion?.evidence ,
        respuesta: this.form.value.answer,
    }
    console.log("Payload {}", payloadRespuesta)
    this.conversationService.validateAnswer( payloadRespuesta ).subscribe ({
      next: (resp:  AnswerValidationResponse ) => {
        console.log("Validacion de respuesta : {}" ,  resp);
        this.validationResponse = resp ;

        if( this.validationResponse.is_valid && this.validationResponse.score >= 70 ){
          this.conversationPayloadResponse();
        }else{
           this.snackBar.open(
              this.validationResponse.feedback + ' : Reponder  nuevamente',
              'Cerrar',
              {
                duration: 4000,
                panelClass: ['error-snackbar']
              }
            );
          
        }


      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
   
    }) 

  }

  //  obtenerSectionsPlanSuscription(){
  //   console.log("obtenerSectionPlan1 => " + this.idSuscriptionConversation)
  //   this.conversationService.getDataConversation( this.idSuscriptionConversation ).subscribe ({
  //     next: (resp: any) => {
  //     this.plan = resp.data;
  //     console.log('PLAN RESP ',  resp.data);
  //     console.log('PLAN ',  this.plan.name);

  //     this.sections = resp.data.sections ;
  //     console.log('SectionS => ',  this.sections);

  //     this.sectionProgress =  this.sections.find(
  //                                             s => s.progress?.status !== "completed"
  //                                           ) ?? null; // Se verifica donde este null en => conversation_section_progress
  //     this.questions = this.sectionProgress?.questions ?? [];

  //     const lastSection = this.sections[this.sections.length - 1] ?? null;

  //     if (lastSection?.progress?.status === "completed") {
  //        this.finalizado = true;
  //        console.log ("Finalizado : {} ", this.finalizado)
  //     }

  //     console.log('Section => ',  this.sectionProgress );
  //     console.log(resp);
  //         console.log("obtenerSectionPlan2 => " + this.idPlan)
  //     },
  //     error: (err: any) => {
  //       console.error(err);
  //     },
  //     complete: () => {
  //       console.log('Completado');
  //     }
  
  //   }) 
  // }

  // validarRespuestasDeInputs(): boolean {
  //   if (!this.sectionActual?.questions) {
  //     return false;
  //   }

  //   return this.sectionActual.questions.every((_, i) =>
  //     this.answers[i] && this.answers[i].trim().length > 0
  //   );
  // }

  conversationPayloadResponse() {
    console.log('Respuestas enviadas:', this.answers);

    // if( !this.validarRespuestasDeInputs() ){ return }

    // aquí puedes armar el payload
    const payload =  { 
        idPlan : this.plan.id ,
        idSection : this.sectionProgress?.id ,
        idConversation : this.idSuscriptionConversation ,
        idQuestion:  this.currentQuestion?.id,
        plan: this.plan.name,
        title: this.sectionProgress?.title,
        description: this.sectionProgress?.description,
        question: this.currentQuestion?.text ,  
        response: this.form.value.answer
    };

    console.log('Payload:', payload);

     this.conversationService.enviarContextoRespuestas( payload ).subscribe ({
      next: (resp: any) => {
        console.log("Respuesta Pregunta : {}" ,  resp);
        this.reply = resp.reply ;
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
   
    })  
  }

  guardarRespuesta(){
    //FORMATO 
    console.log("guardarRespuesta" + this.idPlan)
    const payload =  { 
        idPlan : this.idPlan ,
        idConversation: this.idConversation ,
        idSection: this.sectionProgress?.id , 
        reply: this.reply
    }

    this.conversationService.guardarRespuestas( payload ).subscribe ({
      next: (resp: any) => {
        console.log(resp);
        this.obtenerDataConversation();
        this.reply = '' ;
        this.answers = [];
      }
   
    })  
  }
  verReporte() {

    this.router.navigate(['/conversation/report/', this.idConversation]);
    /*const url = this.router.serializeUrl(
      this.router.createUrlTree([
        '/conversation/report',
        
      ])
    );*/

   // window.open(url, '_blank');
  }
  generarArchivo() {
     
    this.conversationService.getDocument(this.idConversation)
      .subscribe( (resp: Blob) => {
        const blob = new Blob([resp], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte.docx';
        a.click();

        window.URL.revokeObjectURL(url);
      
    });

  }



}

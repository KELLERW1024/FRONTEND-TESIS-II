import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ConversationService } from '../service/conversation.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MaterialModule } from 'src/app/material.module';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';

@Component({
  selector: 'app-question-diagnostic-modal',
  imports: [MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, MatProgressSpinnerModule],
  templateUrl: './question-diagnostic-modal.component.html',
  styleUrl: './question-diagnostic-modal.component.scss',
})
export class QuestionDiagnosticComponent {

  idConversation!: number;
  questions: any[] = [];

  showModal = false;
  selectedQuestion: any = null;

  constructor(
    // private dialogRef: MatDialogRef<QuestionDiagnosticModalComponent>,
    // @Inject(MAT_DIALOG_DATA) public question: any
      private sanitizer: DomSanitizer, 
    private conversationService: ConversationService,
    private router: Router , 
    private route: ActivatedRoute, 
    private fb: FormBuilder, 
    private snackBar: MatSnackBar, 
    private dialog: MatDialog, 
    private http: HttpClient

  ) {}

  // cerrar(): void {
  //   this.dialogRef.close();
  // }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idConversation = params['id'];
      //this.addConversation();
    });
    this.obtenerDataDiagnostic();
  }

  obtenerDataDiagnostic(){

    console.log("Suscription => obtenerDataConversation "   )

    this.conversationService.getQuestionsDiagnostic( this.idConversation ).subscribe ({
      next: (resp: any) => {

          console.log(" Questions Diagnostic => " , resp )
          if (resp.status === 200) {

              this.questions = resp.questions.map((question: any) => ({
                  ...question,
                  answer: ''
              }));

          }

      }
    })
    
  }

  guardarInformacion(): void {

    // Buscar preguntas con respuestas inválidas
    const preguntasInvalidas = this.questions.filter(question => {
      const respuesta = question.answer?.trim() || '';
      return respuesta.length < 5;
    });

    // Si existen preguntas inválidas
   if (preguntasInvalidas.length > 0) {
      return this.showDialog(
        'error',
        'Debes responder correctamente ' +
          preguntasInvalidas.length +
          ' pregunta(s). La respuesta debe tener al menos 5 caracteres.',
        'Error'
      );
    }


    // Todas las respuestas son válidas
    console.log('Respuestas válidas:', this.questions);

     const data = {
      id_subscription_conversation: this.idConversation,

      questions: this.questions.map((question: any) => ({
        id_question: question.id,
        answer: question.answer.trim()
      }))
    };

    console.log('DATA A ENVIAR:', data);

    // Aquí posteriormente puedes llamar a tu servicio
    this.conversationService.saveAnswerDiagnostic( data ).subscribe ({
      next: (resp: any) => {

          console.log(" saveAnswerDiagnostic => " , resp )
           if ( resp.success ) {

             

                setTimeout(() => {
                  this.router.navigate(['/conversations/edit', this.idConversation ]);
                }, 2000);

                return  this.showDialog(
                  'success',
                  'El diagnóstico fue guardado correctamente.',
                  'Éxito'
                );;

            }

      },
      error: (error) => {

        console.error('Error al guardar diagnóstico:', error);

        this.showDialog(
          'error',
          'Ocurrió un error al guardar el diagnóstico.',
          'Error'
        );

      }
    })

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

  verDetalle(question: any) {
    this.selectedQuestion = question;
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

}

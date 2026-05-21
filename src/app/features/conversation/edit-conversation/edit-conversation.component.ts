import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { IaResponse } from 'src/app/core/models/IAResponse';
import { DomSanitizer } from '@angular/platform-browser';

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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

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

  selectedFiles: File[] = [];
  previewFiles: string[] = [];

  form!: FormGroup;

  images: string[] = [];
  imagesSafe: any[] = [];
  selectedImage: string | null = null;

  openImage(img: string) {
    this.selectedImage = img;
    document.body.style.overflow = 'hidden';
  }

  closeImage() {
    this.selectedImage = null;
    document.body.style.overflow = 'auto';
  }


  constructor( private sanitizer: DomSanitizer, 
    private conversationService: ConversationService,
    private router: Router , 
    private route: ActivatedRoute, private fb: FormBuilder, private snackBar: MatSnackBar, private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      answer: [''], 
      showImages: [false]
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

  obtenerDataConversation(){

    console.log("Suscription => obtenerDataConversation "   )

    this.conversationService.getDataConversation( this.idSuscriptionConversation ).subscribe ({
      next: (resp: any) => {
      this.plan = resp.data.plan;
      console.log('PLAN => ',  resp);

      this.sections = this.plan.sections ;
      console.log('Sections => ',  this.sections);

      this.sectionProgress = this.sections.find(
          (s: any) =>
                      s.progress_section === 'in_progress' ||
                      s.progress_section === null
              ) ?? null;

      console.log('SectionCurrent => ',  this.sectionProgress );

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
  onFileSelected(event: any) {

     const files: FileList = event.target.files;

      // IMPORTANTE: no perder referencia previa si quieres acumular
      const newFiles: File[] = [];

      for (let i = 0; i < files.length && i < 2; i++) {
        newFiles.push(files[i]);
      }

      // si quieres REEMPLAZAR siempre:
      this.selectedFiles = [...this.selectedFiles, ...newFiles];

      // reset para permitir re-selección del mismo archivo
      event.target.value = '';
  }
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  trackByFile(index: number, file: File): string {
    return file.name + file.lastModified;
  }
  

  validarRespuesta(){
    const respuesta = this.form.value.answer?.trim() || '';
    console.count('🔥 validarRespuesta');

    if ( !respuesta && this.selectedFiles.length == 0 ) {
       return this.showDialog('error', 'La respuesta es obligatoria', 'Error');
    }

    if (this.selectedFiles.length > 2) {
      return this.showDialog('error', 'Solo se permiten dos archivos', 'Error');
    }

    const allowedDocTypes = [
                            'application/pdf',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                          ];
    const images = this.selectedFiles.filter(f => f.type.startsWith('image/'));
    const docs = this.selectedFiles.filter(f =>
                                              allowedDocTypes.includes(f.type)
                                            );

    if (images.length > 1 || docs.length > 1) {
      return this.showDialog(
        'info',
        'Solo puedes subir como máximo 1 imagen y 1 documento por envío.',
        'Info'
      );
    }

    const invalidFile = this.selectedFiles.find(
      file => !this.isValidFile(file)
    );

    if (invalidFile) {
      return this.showDialog('info', 
        'Solo se permiten documentos (DOCX, DOC, PDF) e imágenes (JPG, PNG) y hojas de cálculo (XLS, XLSX)', 'Info'
      );
    }

    const formData = this.buildFormData(respuesta);

    this.conversationService
      .validateAnswer(formData)
      .subscribe({

        next: (resp: AnswerValidationResponse) => {

          console.log("Validacion:", resp);

          this.validationResponse = resp;

          if (
            this.validationResponse.is_valid &&
            this.validationResponse.score >= 70
          ) {
            //return this.showDialog('success',  this.validationResponse.feedback , 'Success');
            this.conversationPayloadResponse();

          } else {
            return this.showDialog('info',  this.validationResponse.feedback , 'Info');

          }

        },

        error: (err: any) => {
          console.error(err);
        },

        complete: () => {
          console.log('Completado');
        }

      });


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
 
  private buildFormData(respuesta: string): FormData {

    const formData = new FormData();

    formData.append(
      'pregunta',
      this.currentQuestion?.text || ''
    );

    formData.append(
      'detail',
      this.currentQuestion?.detail || ''
    );

    formData.append(
      'validation',
      this.currentQuestion?.validation || ''
    );

    formData.append(
      'apa',
      this.currentQuestion?.apa || ''
    );

    formData.append(
      'respuesta',
      respuesta
    );

    this.selectedFiles.forEach(file => {
      formData.append('files[]', file, file.name);
    });

    return formData;
  }

  private buildFormDataOK(): FormData {

    const formData = new FormData();

    formData.append('idPlan', String(this.plan.id));
    formData.append('idSection', String(this.sectionProgress?.id));
    formData.append('idConversation', String(this.idSuscriptionConversation));
    formData.append('idQuestion', String(this.currentQuestion?.id));

    formData.append('plan', this.plan.name);
    formData.append('title', this.sectionProgress?.title ?? '');
     formData.append(
      'detail',
      this.currentQuestion?.detail || ''
    );

   formData.append(
      'validation',
      this.currentQuestion?.validation || ''
    );

    formData.append(
      'apa',
      this.currentQuestion?.apa || ''
    );
    formData.append('description', this.sectionProgress?.description ?? '');
    formData.append('question', this.currentQuestion?.text ?? '');

    formData.append('response', this.form.value.answer ?? '');
    formData.append('apa', this.form.value.showImages ? '1' : '0');
    formData.append('is_visual', this.form.value.showImages ? '1' : '0');

    this.selectedFiles.forEach(file => {
      formData.append('files[]', file, file.name);
    });

    return formData;
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

    
    const formDataPayload = this.buildFormDataOK();

    console.log('Payload:', formDataPayload);

     this.conversationService.enviarContextoRespuestas(formDataPayload).subscribe({
        next: (resp: IaResponse) => {

          console.log("Respuesta Pregunta : {}", resp);
           if ( !resp.is_valid  ) {
            return this.showDialog('info',  resp.feedback ?? '' , 'Info');

          } 
          this.reply = resp.response ?? '';
          // this.images = resp.images ?? [];

          // if (this.images.length > 0) {

          //   this.imagesSafe = this.images.map((img: string) =>
          //     this.sanitizer.bypassSecurityTrustUrl(img)
          //   );

          // } else {
          //   this.imagesSafe = [];
          // }
        },

        error: (err: any) => {
          console.error(err);
        },

        complete: () => {
          console.log('Completado');
        }
      });
  }

  guardarRespuesta(){
    //FORMATO 
    console.log("guardarRespuesta" + this.idPlan)
    const payload =  { 
        idPlan : this.plan.id ,
        idConversation: this.idSuscriptionConversation,
        idSection: this.sectionProgress?.id , 
        idQuestion : this.currentQuestion?.id,
        reply: this.reply
    }

    this.conversationService.guardarRespuestas( payload ).subscribe ({
      next: (resp: any) => {
        console.log("Estado Guaradar Respuesta {} ", resp);
        this.obtenerDataConversation();
        this.reply = '' ;
        this.answers = [];
        this.selectedFiles = [];
        this.form.reset();
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

  isValidFile(file: File): boolean {

    const allowedTypes = [

      // imágenes
      'image/jpeg',
      'image/jpg',
      'image/png',

      // PDF
      'application/pdf',

      // Word
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

      // Excel
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    const isValidType = allowedTypes.includes(file.type);
    const isValidSize = file.size <= maxSize;

    return isValidType && isValidSize;
  }
  

  // validateFiles() {

  //   if (this.selectedFiles.length > 2) {
  //     this.selectedFiles = [];

  //     this.snackBar.open(
  //       'Solo se permiten máximo 2 archivos',
  //       'Cerrar',
  //       { duration: 4000 }
  //     );

  //     return;
  //   }

  //   let images = 0;
  //   let docs = 0;

  //   this.selectedFiles.forEach(file => {

  //     if (file.type.startsWith('image/')) {
  //       images++;
  //     } else {
  //       docs++;
  //     }
  //   });

  //   if (images > 1) {
  //     this.selectedFiles = [];

  //     this.snackBar.open(
  //       'Solo se permite 1 imagen',
  //       'Cerrar',
  //       { duration: 4000 }
  //     );
  //   }

  //   if (docs > 1) {
  //     this.selectedFiles = [];

  //     this.snackBar.open(
  //       'Solo se permite 1 documento',
  //       'Cerrar',
  //       { duration: 4000 }
  //     );
  //   }
  // }



}

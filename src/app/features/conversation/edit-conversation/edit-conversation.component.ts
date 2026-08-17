import { CommonModule } from '@angular/common';
import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
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
import { ChatResponse, ChatTable, IaImageResponse, IaResponse } from 'src/app/core/models/IAResponse';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConversationPlanResponse } from 'src/app/core/models/ConversationPlanResponse';

@Component({
  selector: 'app-edit-conversation',
  imports: [ MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, MatProgressSpinnerModule],
  templateUrl: './edit-conversation.component.html',
  styleUrl: './edit-conversation.component.scss',
})
export class EditConversationComponent {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('tableModal') tableModal!: TemplateRef<any>;
  
  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  idSuscriptionConversation!: number;
  idPlan!: number;
  idConversation!: number; 
  dataCurrentQuestion!: ConversationPlanResponse;
  // sections: Section[] = [];

  // sectionProgress: Section | null = null;
  // questions: Question[] = [];
  // currentQuestion!: Question | null;
  answers: string[] = [];

  reply : string = "";
  iaResponse : IaResponse | null;

  iaImageResponse : IaImageResponse  | null = null ;

  finalizado : boolean = false;

  selectedQuestion: any = null;
  showModal = false;

  selectedFiles: File[] = [];

  selectedFilesAdd: any[] = [];
  selectedFilesAddDoc: any[] = [];
  previewFiles: string[] = [];

  imagesAdd : any[] = [];

  tablaGenerada : ChatTable | null;

  form!: FormGroup;

  images: string[] = [];
  imagesSafe: any[] = [];
  selectedImage: string | null = null; // mostrar imagen generada por la IA
  descripcionImagenIA: string = '';

  mostrarDiv = false;

  isLoading = false;

  questionsDiagnostic: any = [];

  displayedTableColumns: string[] = [];
  mostrarImagenIA = false;


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
    private route: ActivatedRoute, 
    private fb: FormBuilder, 
    private snackBar: MatSnackBar, 
    private dialog: MatDialog, 
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      answer: [''], 
      showImages: [false], 
      crearCuadro: [false], 

      image: [null],
      imageDescription: ['']
    });
    
    this.finalizado = false;
    this.route.params.subscribe(params => {
      this.idSuscriptionConversation = params['id'];
      //this.addConversation();
    });

    console.log("ONIT => " + this.idSuscriptionConversation)
    
    this.obtenerDataConversation();

  }

  viewStructure() {
    this.router.navigate(['/conversations/structure', this.idSuscriptionConversation]);
  }
  irAvance() {
    this.router.navigate(['/conversations/view', this.idSuscriptionConversation]);
  }
  irEditCapitulo() {
    this.router.navigate(['/conversations/edit-capitulo-conversation', this.idSuscriptionConversation]);
  }
  irDeleteCapitulo() {
    this.router.navigate(['/conversations/delete-capitulo-conversation', this.idSuscriptionConversation]);
  }
  // DOCUMENTO 
  onFileSelected(event: any): void {

    const files = Array.from(event.target.files as FileList);

    if (!files.length) {
      return;
    }

    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       // PowerPoint
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
      
    ];

    // Todos los archivos (existentes + nuevos)
    const allFiles = [...this.selectedFiles, ...files];

    // Máximo 2 archivos
    if (allFiles.length > 2) {
      this.showDialog('error', 'Solo se permiten dos archivos.', 'Error');
      event.target.value = '';
      return;
    }

    const images = allFiles.filter(file => file.type.startsWith('image/'));
    const docs = allFiles.filter(file => allowedDocTypes.includes(file.type));

    // Solo una imagen
    if (images.length > 1) {
      this.showDialog('info', 'Solo puedes subir una imagen.', 'Info');
      event.target.value = '';
      return;
    }

    // Solo un documento
    if (docs.length > 1) {
      this.showDialog('info', 'Solo puedes subir un documento.', 'Info');
      event.target.value = '';
      return;
    }

    // No se permiten otros tipos de archivo
    if (images.length + docs.length !== allFiles.length) {
      this.showDialog('error', 'Solo se permiten imágenes y documentos.', 'Error');
      event.target.value = '';
      return;
    }

    this.selectedFiles = allFiles;
    event.target.value = '';
  }
  mostrarSeccion(): void {
    this.mostrarDiv = !this.mostrarDiv;
  }
  onDragOver2(event: DragEvent) {
    event.preventDefault();
  }
  onDrop2(event: DragEvent): void {
    event.preventDefault();

    const files = event.dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

       // PowerPoint
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
    ];

    // Solo para validar
    const newFiles = Array.from(files);
    const allFiles = [...this.selectedFiles, ...newFiles];

    // Máximo 2 archivos
    if (allFiles.length > 2) {
      this.showDialog('error', 'Solo se permiten dos archivos.', 'Error');
      return;
    }

    const images = allFiles.filter(file => file.type.startsWith('image/'));
    const docs = allFiles.filter(file => allowedDocTypes.includes(file.type));

    if (images.length > 1) {
      this.showDialog('info', 'Solo puedes subir una imagen.', 'Info');
      return;
    }

    if (docs.length > 1) {
      this.showDialog('info', 'Solo puedes subir un documento.', 'Info');
      return;
    }

    const invalidFile = allFiles.find(file => !this.isValidFile(file));

    if (invalidFile) {
      this.showDialog(
        'info',
        'Solo se permiten documentos (DOCX, DOC, PDF, XLS, XLSX) e imágenes (JPG, PNG).',
        'Info'
      );
      return;
    }

    // Aquí sigues enviando el FileList original
    this.processFiles2(files);
  }

   private processFiles2(files: FileList): void {

    Array.from(files).forEach(file => {

      const isImage = file.type.startsWith('image/');

      const item: any = {
        file,
        category: isImage ? 'image' : 'document',
        description: '',
        fuente: '',
        name: file.name,
        type: file.type,
        size: file.size,
        preview: null
      };

      if (isImage) {

        const reader = new FileReader();

        reader.onload = () => {
          item.preview = reader.result;

          this.selectedFiles = [
            ...this.selectedFiles,
            ...Array.from(files)
          ];
        };

        reader.readAsDataURL(file);

      } else {

        this.selectedFiles = [
          ...this.selectedFiles,
          ...Array.from(files)
        ];

      }

    });

  }
 
  // 
  onFileSelectedAddDoc(event: any) : void {

        const files: FileList = event.target.files;

        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {

          const isImage = file.type.startsWith('image/');

          const item: any = {

            file: file,

            category: isImage ? 'image' : 'document',
            description: '',
            fuente: '',
            name: file.name,
            type: file.type,
            size: file.size,
            preview: null
          };

          // 🖼 preview solo imágenes
          if (isImage) {

            const reader = new FileReader();

            reader.onload = () => {

              item.preview = reader.result;

              this.selectedFilesAddDoc = [
                  ...this.selectedFilesAddDoc,
                  item
                ];

            };

            reader.readAsDataURL(file);

          }
          else {

            this.selectedFilesAddDoc.push(item);

          }

        });

        console.log(this.selectedFilesAddDoc);

        event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
  onDrop(event: DragEvent) {
    event.preventDefault();

    const files = event.dataTransfer?.files;

    if (!files || files.length === 0) return;

      const allowedFiles = Array.from(files).filter(file => {

      const isImage = file.type.startsWith('image/');

      const isExcel =
        file.type === 'application/vnd.ms-excel' || // .xls
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.name.toLowerCase().endsWith('.xls') ||
        file.name.toLowerCase().endsWith('.xlsx');

      return isImage || isExcel;

    });

    if (allowedFiles.length === 0) {
      return this.showDialog('info', 
        'Solo se permiten imágenes y archivos Excel.', 'Info'
      );
    }

    this.processFiles(files);
  }
  private processFiles(files: FileList): void {

    Array.from(files).forEach(file => {

      const isImage = file.type.startsWith('image/');

      const item: any = {
        file,
        category: isImage ? 'image' : 'document',
        description: '',
        fuente: '',
        name: file.name,
        type: file.type,
        size: file.size,
        preview: null
      };

      if (isImage) {

        const reader = new FileReader();

        reader.onload = () => {
          item.preview = reader.result;

          this.selectedFilesAddDoc = [
            ...this.selectedFilesAddDoc,
            item
          ];
        };

        reader.readAsDataURL(file);

      } else {

        this.selectedFilesAddDoc = [
          ...this.selectedFilesAddDoc,
          item
        ];

      }

    });

  }
  // 

  verDetalle(question: any) {
    this.selectedQuestion = question;
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
  }

  limpiar(): void {
    this.form.reset();
  }

  obtenerDataConversation(){

    console.log("Suscription => obtenerDataConversation "   )

    this.conversationService.getDataConversation( this.idSuscriptionConversation ).subscribe ({
      next: (resp: ConversationPlanResponse ) => {
      // this.plan = resp.data.plan;

      this.dataCurrentQuestion = resp;
      console.log('Data Question Ultimate => ',  resp);

      // this.sections = this.plan.sections ;

     

      // console.log(" QUESTION CURRENT => {}" , this.currentQuestion);

      // this.finalizado = this.sections.every((s: any) => !!s.answer);
      },
      error: (err: any) => {
        console.error(err);
      },
      complete: () => {
        console.log('Completado');
      }
  
    }) 
  }
 

  // onFileSelectedAdd(event: any) : void {

  //     const files: FileList = event.target.files;

  //     const readers = Array.from(files).map(file => {

  //         return new Promise<any>((resolve) => {

  //           const reader = new FileReader();
  //           reader.onload = () => {

  //             resolve({
  //               file: file,
  //               preview: reader.result,
  //               description: '', 
  //               fuente:  ''
  //             });

  //           };

  //           reader.readAsDataURL(file);
  //         });

  //     });

  //     Promise.all(readers).then(results => {

  //       this.selectedFilesAdd = [
  //         ...this.selectedFilesAdd,
  //         ...results
  //       ];

  //     });

  //     event.target.value = '';
  // }


  trackByFile(index: number, file: File): string {
    return file.name + file.lastModified;
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
  prepararTabla(): void {

  if (!this.tablaGenerada) {
    this.displayedTableColumns = [];
    return;
  }

  // console.log('Preparando tabla:', this.tablaGenerada);

  if (
    Array.isArray(this.tablaGenerada.columns) &&
    Array.isArray(this.tablaGenerada.rows)
  ) {

    this.displayedTableColumns = this.tablaGenerada.columns.map(
      (_: string, index: number) => `col${index}`
    );

    // console.log('Columnas para Angular:', this.displayedTableColumns);
    // console.log('Filas:', this.tablaGenerada.rows);

  } else {

    console.error('Formato de tabla incorrecto:', this.tablaGenerada);
    this.displayedTableColumns = [];
  }
}


  private buildFormData( tipo : string ): FormData {

    const formData = new FormData();

    // 🔥 DATA BASE (siempre)
    // formData.append('idPlan', String(this.plan.id));
    // formData.append('idSection', String(this.sectionProgress?.id ?? ''));
    formData.append('idConversation', String(this.idSuscriptionConversation ?? ''));
    formData.append('idQuestion', String(this.dataCurrentQuestion.question?.id ?? ''));

    switch( tipo ){

      case "validate":

          // formData.append('plan', this.plan.name);
          // formData.append('title', this.dataCurrentQuestion?.question?.question_text ?? '');
         

          formData.append('description', this.dataCurrentQuestion?.parent_node?.titulo?? '');
          formData.append('question', this.dataCurrentQuestion?.question?.question_text ?? '');
          formData.append( 'detail', this.dataCurrentQuestion?.question?.question_detail || '' );
          formData.append( 'validation', this.dataCurrentQuestion?.question?.validation_detail || '' );

          formData.append('response', this.form.value.answer ?? '');
          
          formData.append('generate_table', this.form.value.crearCuadro ? '1' : '0');
          formData.append('is_visual', this.form.value.showImages ? '1' : '0');



          this.selectedFiles.forEach( file => {
            formData.append('files[]', file, file.name);
          });

        break;
      case "save" :

            formData.append('reply', this.reply);

            formData.append(
              'metadata',
              JSON.stringify(
                this.selectedFilesAddDoc.map(item => ({
                  description: item.description,
                  fuente: item.fuente
                }))
              )
            );

            this.selectedFilesAddDoc.forEach(item => {
              //  console.log('INDEX:', index);
              console.log('NAME:', item.file.name);
              console.log('TYPE:', item.file.type);
              console.log('SIZE:', item.file.size);
              formData.append('files[]', item.file, item.file.name);
            });
            console.log(this.iaResponse?.references);
            formData.append( 'references', JSON.stringify(this.iaResponse?.references ?? []) );

             formData.append(
              'table',
              JSON.stringify(this.tablaGenerada)
            );

            if( this.iaImageResponse?.output?.length ){
                  formData.append( 'url_imagen_ia', this.iaImageResponse.output[0] ) ;
                  formData.append( 'desc_imagen_ia',  this.descripcionImagenIA ) ;
            }

        break;

    }
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], 'FILE =>', pair[1].name, pair[1].size);
      } else {
        console.log(pair[0], pair[1]);
      }
    }

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
        const respuesta = this.form.value.answer?.trim() || '';
    console.count('🔥 validarRespuesta');

    if ( !respuesta && this.selectedFiles.length == 0 ) {
       return this.showDialog('error', 'La respuesta es obligatoria', 'Error');
    }

    
    
    const formDataPayload = this.buildFormData("validate");

    console.log('Payload:', formDataPayload);
    this.iaResponse = null;
    this.reply = '' ;
    this.selectedFilesAddDoc = [];

    this.isLoading = true;
     this.conversationService.enviarContextoRespuestas(formDataPayload).subscribe({
        next: (resp: ChatResponse) => {

          this.iaResponse = resp.response;
          console.log("Respuesta Completa : {}", resp );
          // console.log("Respuesta  VALID : ", this.iaResponse );
          console.log("Respuesta feedback : {}", this.iaResponse.is_valid );
          console.log("IMAGEN IA=> {} ", resp.image ?? null );


          if ( !resp.is_valid  ) {

            return this.showDialog('info',  resp.feedback ?? '' , 'Info');

          } 
          this.reply = this.iaResponse.response ?? '';
          this.iaImageResponse = resp.image ?? null;
          const predictionId = this.iaImageResponse?.id;
          if (
            this.iaImageResponse &&
            (this.iaImageResponse.status === 'processing' || this.iaImageResponse.status === 'starting')
             && predictionId
          ) {

             console.log(  '🚀 INICIANDO POLLING REPLICATE:',  predictionId);
            this.consultarImagenReplicate(
              predictionId
            );
           
          }
          this.tablaGenerada = resp.table ?? null;
          
          // console.log("COUNT IMAGEN IA=> {} ", resp.count_ia_image ?? 0 );
          console.log('================ TABLE ================');
console.log(this.tablaGenerada);
console.log('========================================');
          
          this.prepararTabla();

         
        },

        error: (err: any) => {
          console.error(err);
          return this.showDialog('info', 'Ocurrió un error, estamos trabajando para solucionarlo', 'Info');
        },

        complete: () => {
           this.isLoading = false;
          console.log('Completado');
        }
      });
  }
  // POLLING IMAGE REPLICATE
  private consultarImagenReplicate(predictionId: string): void {

    let intentos = 0;

    const maxIntentos = 60;

    const intervalo = setInterval(() => {

      intentos++;

      console.log(
        `Consultando imagen ${intentos}/${maxIntentos}`
      );

      this.conversationService.getReplicatePrediction(predictionId)
        .subscribe({

          next: (resp: any) => {

            console.log(
              'Estado Replicate:',
              resp.status
            );

            if (
              resp.status === 'starting' ||
              resp.status === 'processing'
            ) {

              if (intentos >= maxIntentos) {

                clearInterval(intervalo);

                console.warn(
                  'Se alcanzó el tiempo máximo de espera'
                );

                return;
              }

              return;
            }

            if (resp.status === 'succeeded') {

              clearInterval(intervalo);

              this.mostrarImagenIA = false;

              this.iaImageResponse = {
                status: 'succeeded',
                output: resp.output
              };

              setTimeout(() => {
                this.mostrarImagenIA = true;
              });

              console.log('Imagen lista:', resp.output);

              return;
            }


            if (
              resp.status === 'failed' ||
              resp.status === 'canceled'
            ) {

              clearInterval(intervalo);

              console.error(
                'Replicate terminó con:',
                resp.status,
                resp.error
              );

              this.iaImageResponse = null;

            }

          },

          error: (err) => {

            clearInterval(intervalo);

            console.error(
              'Error consultando imagen:',
              err
            );

          }

        });

    }, 2000);
  }


  guardarRespuesta(){
    //FORMATO 

    const formDataPayload = this.buildFormData("save");

    this.conversationService.guardarRespuestas( formDataPayload ).subscribe ({
      next: (resp: any) => {
        console.log("Estado Guaradar Respuesta {} ", resp);
        this.obtenerDataConversation();
        this.reply = '' ;
        this.answers = [];
        this.selectedFiles = [];
        this.form.reset();
        this.iaResponse = null;
          // this.form.reset({
          //   answer: '',
          //   showImages: true,
          //   citaApa: true,
          //   image: null,
          //   imageDescription: ''
          // });
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
     
    this.conversationService.getDocument(this.idSuscriptionConversation)
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
  
openModalTable(): void {

  console.log('Intentando abrir tabla...');
  console.log('tablaGenerada:', this.tablaGenerada);
  console.log('displayedTableColumns:', this.displayedTableColumns);

  if (!this.tablaGenerada) {
    console.warn('No existe tabla generada');
    return;
  }

  if (!Array.isArray(this.tablaGenerada.columns)) {
    console.error('tablaGenerada.columns no es un array');
    return;
  }

  if (!Array.isArray(this.tablaGenerada.rows)) {
    console.error('tablaGenerada.rows no es un array');
    return;
  }

  this.prepararTabla();

  this.dialog.open(this.tableModal, {
    width: '90vw',
    maxWidth: '1200px',
    maxHeight: '80vh',
    autoFocus: false
  });
}


  verImagenGrande( template: TemplateRef<any> ) {
    this.dialog.open(template, {
      width: '90vw',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'image-dialog'
    });
  }

descargarImagen(url: string) {
  this.http.get(url, { responseType: 'blob' }).subscribe(blob => {

    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'imagen-generada.png';
    link.click();

    window.URL.revokeObjectURL(objectUrl);

  });
}

eliminarImagenIA(): void {

    if (this.iaImageResponse) {
        this.iaImageResponse.output = [];
    }

    // Si quieres ocultar completamente la tarjeta
    this.iaImageResponse = null;
}



}

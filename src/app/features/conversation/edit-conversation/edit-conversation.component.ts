import { CommonModule } from '@angular/common';
import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';

import { ConversationService } from '../service/conversation.service';

import { DialogComponent } from 'src/app/components/dialog/dialog.component';

import {
  Plan,
  Question,
  Section
} from 'src/app/core/models/PlanResponse';

import {
  ChatResponse,
  ChatTable,
  IaImageResponse,
  IaResponse
} from 'src/app/core/models/IAResponse';

import { ConversationPlanResponse } from 'src/app/core/models/ConversationPlanResponse';

import { DomSanitizer } from '@angular/platform-browser';
import { ConversationFormService } from '../service/conversation-form.service';


@Component({
  selector: 'app-edit-conversation',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-conversation.component.html',
  styleUrl: './edit-conversation.component.scss',
})
export class EditConversationComponent {

  // ============================================================
  // VIEW CHILD
  // ============================================================

  @ViewChild('fileInput')
  fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('tableModal')
  tableModal!: TemplateRef<any>;


  // ============================================================
  // VARIABLES - CONVERSACIÓN
  // ============================================================

  idSuscriptionConversation!: number;
  idPlan!: number;
  idConversation!: number;

  dataCurrentQuestion!: ConversationPlanResponse;

  answers: string[] = [];

  reply: string = '';

  finalizado: boolean = false;

  questionsDiagnostic: any = [];


  // ============================================================
  // VARIABLES - FORMULARIO
  // ============================================================

  form!: FormGroup;

  isLoading = false;

  mostrarDiv = false;

  selectedQuestion: any = null;

  showModal = false;


  // ============================================================
  // VARIABLES - ARCHIVOS
  // ============================================================

  selectedFiles: File[] = [];

  selectedFilesAdd: any[] = [];

  selectedFilesAddDoc: any[] = [];

  previewFiles: string[] = [];

  imagesAdd: any[] = [];


  // ============================================================
  // VARIABLES - TABLAS
  // ============================================================

  tablaGenerada: ChatTable | null = null;

  displayedTableColumns: string[] = [];


  // ============================================================
  // VARIABLES - IA
  // ============================================================

  iaResponse: IaResponse | null = null;

  iaImageResponse: IaImageResponse | null = null;

  descripcionImagenIA: string = '';

  mostrarImagenIA = false;

  urlImagenIA : string = '';


  // ============================================================
  // VARIABLES - IMÁGENES
  // ============================================================

  images: string[] = [];

  imagesSafe: any[] = [];

  selectedImage: string | null = null;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private sanitizer: DomSanitizer,
    private conversationService: ConversationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient, 
    private conversationFormService: ConversationFormService
  ) {}


  // ============================================================
  // CICLO DE VIDA
  // ============================================================

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

    console.log(
      "ONIT => " + this.idSuscriptionConversation
    );

    this.obtenerDataConversation();
  }


  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  viewStructure() {

    this.router.navigate([
      '/conversations/structure',
      this.idSuscriptionConversation
    ]);

  }

  irAvance() {

    this.router.navigate([
      '/conversations/view',
      this.idSuscriptionConversation
    ]);

  }

  irEditCapitulo() {

    this.router.navigate([
      '/conversations/edit-capitulo-conversation',
      this.idSuscriptionConversation
    ]);

  }

  irDeleteCapitulo() {

    this.router.navigate([
      '/conversations/delete-capitulo-conversation',
      this.idSuscriptionConversation
    ]);

  }

  verReporte() {

    this.router.navigate([
      '/conversation/report/',
      this.idConversation
    ]);

    /*
    const url = this.router.serializeUrl(
      this.router.createUrlTree([
        '/conversation/report',
      ])
    );

    window.open(url, '_blank');
    */

  }


  // ============================================================
  // DATOS DE LA CONVERSACIÓN
  // ============================================================

  obtenerDataConversation() {

    console.log(
      "Suscription => obtenerDataConversation "
    );

    this.conversationService
      .getDataConversation(this.idSuscriptionConversation)
      .subscribe({

        next: (resp: ConversationPlanResponse) => {

          // this.plan = resp.data.plan;

          this.dataCurrentQuestion = resp;

          console.log(
            'Data Question Ultimate => ',
            resp
          );

          // this.sections = this.plan.sections;

          // console.log(
          //   " QUESTION CURRENT => {}",
          //   this.currentQuestion
          // );

          // this.finalizado =
          //   this.sections.every(
          //     (s: any) => !!s.answer
          //   );

        },

        error: (err: any) => {

          console.error(err);

        },

        complete: () => {

          console.log('Completado');

        }

      });

  }


  // ============================================================
  // MANEJO DE ARCHIVOS - RESPUESTA
  // ============================================================

  openFilePicker() {

    this.fileInput.nativeElement.click();

  }


  onFileSelected(event: any): void {

    const files = Array.from(
      event.target.files as FileList
    );

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
      'application/vnd.ms-powerpoint',

      'application/vnd.openxmlformats-officedocument.presentationml.presentation'

    ];

    const allFiles = [
      ...this.selectedFiles,
      ...files
    ];

    // Máximo 2 archivos
    if (allFiles.length > 2) {

      this.showDialog(
        'error',
        'Solo se permiten dos archivos.',
        'Error'
      );

      event.target.value = '';

      return;
    }

    const images = allFiles.filter(
      file => file.type.startsWith('image/')
    );

    const docs = allFiles.filter(
      file => allowedDocTypes.includes(file.type)
    );

    // Solo una imagen
    if (images.length > 1) {

      this.showDialog(
        'info',
        'Solo puedes subir una imagen.',
        'Info'
      );

      event.target.value = '';

      return;
    }

    // Solo un documento
    if (docs.length > 1) {

      this.showDialog(
        'info',
        'Solo puedes subir un documento.',
        'Info'
      );

      event.target.value = '';

      return;
    }

    // No se permiten otros tipos
    if (
      images.length + docs.length !==
      allFiles.length
    ) {

      this.showDialog(
        'error',
        'Solo se permiten imágenes y documentos.',
        'Error'
      );

      event.target.value = '';

      return;
    }

    this.selectedFiles = allFiles;

    event.target.value = '';

  }


  removeFile(index: number): void {

    this.selectedFiles.splice(index, 1);

  }


  trackByFile(
    index: number,
    file: File
  ): string {

    return file.name + file.lastModified;

  }


  // ============================================================
  // DRAG & DROP - RESPUESTA
  // ============================================================

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
      'application/vnd.ms-powerpoint',

      'application/vnd.openxmlformats-officedocument.presentationml.presentation'

    ];

    const newFiles = Array.from(files);

    const allFiles = [
      ...this.selectedFiles,
      ...newFiles
    ];

    // Máximo 2 archivos
    if (allFiles.length > 2) {

      this.showDialog(
        'error',
        'Solo se permiten dos archivos.',
        'Error'
      );

      return;
    }

    const images = allFiles.filter(
      file => file.type.startsWith('image/')
    );

    const docs = allFiles.filter(
      file => allowedDocTypes.includes(file.type)
    );

    if (images.length > 1) {

      this.showDialog(
        'info',
        'Solo puedes subir una imagen.',
        'Info'
      );

      return;
    }

    if (docs.length > 1) {

      this.showDialog(
        'info',
        'Solo puedes subir un documento.',
        'Info'
      );

      return;
    }

    const invalidFile = allFiles.find(
      file => !this.isValidFile(file)
    );

    if (invalidFile) {

      this.showDialog(
        'info',
        'Solo se permiten documentos (DOCX, DOC, PDF, XLS, XLSX) e imágenes (JPG, PNG).',
        'Info'
      );

      return;
    }

    this.processFiles2(files);

  }


  private processFiles2(files: FileList): void {

    Array.from(files).forEach(file => {

      const isImage =
        file.type.startsWith('image/');

      const item: any = {

        file,

        category: isImage
          ? 'image'
          : 'document',

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


  // ============================================================
  // ARCHIVOS ADICIONALES
  // ============================================================

  onFileSelectedAddDoc(event: any): void {

    const files: FileList = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    Array.from(files).forEach(file => {

      const isImage =
        file.type.startsWith('image/');

      const item: any = {

        file: file,

        category: isImage
          ? 'image'
          : 'document',

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

        this.selectedFilesAddDoc.push(item);

      }

    });

    console.log(
      this.selectedFilesAddDoc
    );

    event.target.value = '';

  }


  onDragOver(event: DragEvent) {

    event.preventDefault();

  }


  onDrop(event: DragEvent) {

    event.preventDefault();

    const files =
      event.dataTransfer?.files;

    if (!files || files.length === 0) {
      return;
    }

    const allowedFiles =
      Array.from(files).filter(file => {

        const isImage =
          file.type.startsWith('image/');

        const isExcel =
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.toLowerCase().endsWith('.xls') ||
          file.name.toLowerCase().endsWith('.xlsx');

        return isImage || isExcel;

      });

    if (allowedFiles.length === 0) {

      return this.showDialog(
        'info',
        'Solo se permiten imágenes y archivos Excel.',
        'Info'
      );

    }

    this.processFiles(files);

  }


  private processFiles(files: FileList): void {

    Array.from(files).forEach(file => {

      const isImage =
        file.type.startsWith('image/');

      const item: any = {

        file,

        category: isImage
          ? 'image'
          : 'document',

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


  // ============================================================
  // TABLAS
  // ============================================================

  prepararTabla(): void {

    if (!this.tablaGenerada) {

      this.displayedTableColumns = [];

      return;
    }

    if (
      Array.isArray(this.tablaGenerada.columns) &&
      Array.isArray(this.tablaGenerada.rows)
    ) {

      this.displayedTableColumns =
        this.tablaGenerada.columns.map(
          (_: string, index: number) =>
            `col${index}`
        );

    } else {

      console.error(
        'Formato de tabla incorrecto:',
        this.tablaGenerada
      );

      this.displayedTableColumns = [];

    }

  }


  openModalTable(): void {

    console.log(
      'Intentando abrir tabla...'
    );

    console.log(
      'tablaGenerada:',
      this.tablaGenerada
    );

    console.log(
      'displayedTableColumns:',
      this.displayedTableColumns
    );

    if (!this.tablaGenerada) {

      console.warn(
        'No existe tabla generada'
      );

      return;
    }

    if (
      !Array.isArray(
        this.tablaGenerada.columns
      )
    ) {

      console.error(
        'tablaGenerada.columns no es un array'
      );

      return;
    }

    if (
      !Array.isArray(
        this.tablaGenerada.rows
      )
    ) {

      console.error(
        'tablaGenerada.rows no es un array'
      );

      return;
    }

    this.prepararTabla();

    this.dialog.open(
      this.tableModal,
      {
        width: '90vw',
        maxWidth: '1200px',
        maxHeight: '80vh',
        autoFocus: false
      }
    );

  }


  // ============================================================
  // VALIDACIÓN DE RESPUESTA
  // ============================================================

  conversationPayloadResponse() {

    console.log(
      'Respuestas enviadas:',
      this.answers
    );

    const respuesta =
      this.form.value.answer?.trim() || '';

    console.count(
      '🔥 validarRespuesta'
    );

    if (
      !respuesta &&
      this.selectedFiles.length == 0
    ) {

      return this.showDialog(
        'error',
        'La respuesta es obligatoria',
        'Error'
      );

    }

    const formDataPayload =
      this.buildFormData('validate');

    console.log(
      'Payload:',
      formDataPayload
    );

    this.iaResponse = null;

    this.reply = '';

    this.selectedFilesAddDoc = [];

    this.isLoading = true;

    this.conversationService .enviarContextoRespuestas(  formDataPayload )
      .subscribe({

        next: (resp: ChatResponse) => {

          this.iaResponse = resp.response;

          console.log( "Respuesta Completa : {}", resp );

          console.log( "Respuesta feedback : {}",  this.iaResponse.is_valid  );


          if (!resp.is_valid) {

            return this.showDialog(  'info', resp.feedback ?? '', 'Info'  );

          }

          this.reply = this.iaResponse.response ?? '';

          this.iaImageResponse =  resp.image ?? null;
          console.log( "IMAGEN RESPONSE IA=> {} ", resp.image ?? null );

          const predictionId =  this.iaImageResponse?.id;

          if (  this.iaImageResponse &&  ( this.iaImageResponse.status === 'processing' ||
                                            this.iaImageResponse.status === 'starting'
                                          ) &&  predictionId  ) {

            console.log(  ' INICIANDO POLLING REPLICATE:',  predictionId );

            this.consultarImagenReplicate( predictionId  );

          }

          this.tablaGenerada = resp.table ?? null;

          console.log(  '================ TABLE ================'  );

          console.log(  this.tablaGenerada );

          console.log(  '========================================'  );

          this.prepararTabla();

        },

        error: (err: any) => {

          console.error(err);

          return this.showDialog(
            'info',
            'Ocurrió un error, estamos trabajando para solucionarlo',
            'Info'
          );

        },

        complete: () => {

          this.isLoading = false;

          console.log(
            'Completado'
          );

        }

      });

  }


  // ============================================================
  // FORM DATA
  // ============================================================

  private buildFormData( tipo: string ): FormData {

    const formData = new FormData();

    formData.append(
      'idConversation',
      String(
        this.idSuscriptionConversation ?? ''
      )
    );

    formData.append(
      'idQuestion',
      String(
        this.dataCurrentQuestion.question?.id ?? ''
      )
    );

    switch (tipo) {

      // --------------------------------------------------------
      // VALIDATE
      // --------------------------------------------------------

      case 'validate':

        formData.append(
          'description',
          this.dataCurrentQuestion
            ?.parent_node
            ?.titulo ?? ''
        );

        formData.append(
          'question',
          this.dataCurrentQuestion
            ?.question
            ?.question_text ?? ''
        );

        formData.append(
          'detail',
          this.dataCurrentQuestion
            ?.question
            ?.question_detail || ''
        );

        formData.append(
          'validation',
          this.dataCurrentQuestion
            ?.question
            ?.validation_detail || ''
        );

        formData.append(
          'response',
          this.form.value.answer ?? ''
        );

        formData.append(
          'generate_table',
          this.form.value.crearCuadro
            ? '1'
            : '0'
        );

        formData.append(
          'is_visual',
          this.form.value.showImages
            ? '1'
            : '0'
        );

        this.selectedFiles.forEach(file => {

          formData.append(
            'files[]',
            file,
            file.name
          );

        });

        break;


      // --------------------------------------------------------
      // SAVE
      // --------------------------------------------------------

      case 'save':

        formData.append(
          'reply',
          this.reply
        );

        formData.append(
          'metadata',
          JSON.stringify(
            this.selectedFilesAddDoc.map(
              item => ({
                description:
                  item.description,

                fuente:
                  item.fuente
              })
            )
          )
        );

        this.selectedFilesAddDoc.forEach(
          item => {

            console.log(
              'NAME:',
              item.file.name
            );

            console.log(
              'TYPE:',
              item.file.type
            );

            console.log(
              'SIZE:',
              item.file.size
            );

            formData.append(
              'files[]',
              item.file,
              item.file.name
            );

          }
        );

        console.log(
          this.iaResponse?.references
        );

        formData.append(
          'references',
          JSON.stringify(
            this.iaResponse?.references ?? []
          )
        );

        formData.append(
          'table',
          JSON.stringify(
            this.tablaGenerada
          )
        );

        if (
          this.iaImageResponse?.status === 'succeeded' &&
          this.iaImageResponse?.output?.length
        ) {

          formData.append(
            'url_imagen_ia',
            this.urlImagenIA
          );

          formData.append(
            'desc_imagen_ia',
            this.descripcionImagenIA ?? ''
          );

        }

        break;

    }

    for (
      let pair of formData.entries()
    ) {

      if (
        pair[1] instanceof File
      ) {

        console.log(
          pair[0],
          'FILE =>',
          pair[1].name,
          pair[1].size
        );

      } else {

        console.log(
          pair[0],
          pair[1]
        );

      }

    }

    return formData;

  }


  // ============================================================
  // GUARDAR RESPUESTA
  // ============================================================

  guardarRespuesta() {

    const formDataPayload =
      this.buildFormData('save');

    this.conversationService
      .guardarRespuestas(
        formDataPayload
      )
      .subscribe({

        next: (resp: any) => {

          console.log(
            "Estado Guaradar Respuesta {} ",
            resp
          );

          this.obtenerDataConversation();

          this.reply = '';

          this.answers = [];

          this.selectedFiles = [];

          this.form.reset();

          this.iaResponse = null;

          /*
          this.form.reset({
            answer: '',
            showImages: true,
            citaApa: true,
            image: null,
            imageDescription: ''
          });
          */

        }

      });

  }


  // ============================================================
  // POLLING IMAGEN IA
  // ============================================================

  private consultarImagenReplicate(
    predictionId: string
  ): void {

    let intentos = 0;

    const maxIntentos = 60;

    const intervalo =
      setInterval(() => {

        intentos++;

        console.log(
          `Consultando imagen ${intentos}/${maxIntentos}`
        );

        this.conversationService .getReplicatePrediction( predictionId )
          .subscribe({

            next: (resp: any) => {

              console.log( 'Estado Replicate:', resp.status );

              if (  resp.status === 'starting' ||  resp.status === 'processing' ) {

                if ( intentos >= maxIntentos ) {

                  clearInterval(  intervalo );

                  console.warn(
                    'Se alcanzó el tiempo máximo de espera'
                  );

                  return;
                }

                return;

              }

              if (  resp.status === 'succeeded' ) {

                clearInterval( intervalo );

                this.mostrarImagenIA =  false;

                this.iaImageResponse = {

                  status: 'succeeded',
                  output: resp.output

                };
                this.urlImagenIA = resp.output;

                setTimeout(() => {

                  this.mostrarImagenIA =
                    true;

                });

                console.log( 'Imagen lista:',  resp.output );

                return;

              }

              if (
                resp.status === 'failed' ||
                resp.status === 'canceled'
              ) {

                clearInterval(
                  intervalo
                );

                console.error(
                  'Replicate terminó con:',
                  resp.status,
                  resp.error
                );

                this.iaImageResponse =
                  null;

              }

            },

            error: (err) => {

              clearInterval(
                intervalo
              );

              console.error(
                'Error consultando imagen:',
                err
              );

            }

          });

      }, 2000);

  }


  // ============================================================
  // IMAGEN IA
  // ============================================================

  get imagenGenerada(): string | null {

    return this.iaImageResponse
      ?.output?.[0] ?? null;

  }


  openImage(img: string) {

    this.selectedImage = img;

    document.body.style.overflow =
      'hidden';

  }


  closeImage() {

    this.selectedImage = null;

    document.body.style.overflow =
      'auto';

  }


  verImagenGrande(
    template: TemplateRef<any>
  ) {

    this.dialog.open(
      template,
      {
        width: '90vw',
        maxWidth: '90vw',
        maxHeight: '90vh',
        autoFocus: false,
        panelClass: 'image-dialog'
      }
    );

  }


descargarImagen(url: string): void {
  const link = document.createElement('a');

  link.href = url;
  link.download = 'imagen-generada.png';
  link.target = '_blank';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



  eliminarImagenIA(): void {

    if (this.iaImageResponse) {

      this.iaImageResponse.output =
        [];

    }

    this.iaImageResponse =
      null;

  }


  // ============================================================
  // VALIDACIÓN DE ARCHIVOS
  // ============================================================

  isValidFile(file: File): boolean {

    const allowedTypes = [

      // imágenes
      'image/jpeg',
      'image/jpg',
      'image/png',

      // PDF
      'application/pdf',

      // Word
      'application/msword',

      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      // Excel
      'application/vnd.ms-excel',

      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    ];

    const maxSize =
      5 * 1024 * 1024;

    const isValidType =
      allowedTypes.includes(
        file.type
      );

    const isValidSize =
      file.size <= maxSize;

    return (
      isValidType &&
      isValidSize
    );

  }


  // ============================================================
  // UI / MODALES
  // ============================================================

  verDetalle(question: any) {

    this.selectedQuestion =
      question;

    this.showModal =
      true;

  }


  cerrarModal() {

    this.showModal =
      false;

  }


  mostrarSeccion(): void {

    this.mostrarDiv =
      !this.mostrarDiv;

  }


  limpiar(): void {

    this.form.reset();

  }


  showDialog(
    type: 'success' | 'error' | 'info',
    message: string,
    title = 'Aviso'
  ) {

    this.dialog.open(
      DialogComponent,
      {
        width: '400px',

        data: {

          type,

          title,

          message,

          confirmText: 'Aceptar'

        }

      }
    );

  }


  // ============================================================
  // GENERAR DOCUMENTO
  // ============================================================

  generarArchivo() {

    this.conversationService
      .getDocument(
        this.idSuscriptionConversation
      )
      .subscribe(
        (resp: Blob) => {

          const blob =
            new Blob(
              [resp],
              {
                type:
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              }
            );

          const url =
            window.URL.createObjectURL(
              blob
            );

          const a =
            document.createElement('a');

          a.href = url;

          a.download =
            'reporte.docx';

          a.click();

          window.URL.revokeObjectURL(
            url
          );

        }
      );

  }


  // ============================================================
  // CÓDIGO ANTERIOR / COMENTADO
  // ============================================================

  // onFileSelectedAdd(event: any) : void {

  //   const files: FileList = event.target.files;

  //   const readers = Array.from(files).map(file => {

  //     return new Promise<any>((resolve) => {

  //       const reader = new FileReader();

  //       reader.onload = () => {

  //         resolve({
  //           file: file,
  //           preview: reader.result,
  //           description: '',
  //           fuente: ''
  //         });

  //       };

  //       reader.readAsDataURL(file);

  //     });

  //   });

  //   Promise.all(readers).then(results => {

  //     this.selectedFilesAdd = [
  //       ...this.selectedFilesAdd,
  //       ...results
  //     ];

  //   });

  //   event.target.value = '';

  // }


  // obtenerSectionsPlanSuscription(){

  //   console.log(
  //     "obtenerSectionPlan1 => " +
  //     this.idSuscriptionConversation
  //   );

  //   this.conversationService
  //     .getDataConversation(
  //       this.idSuscriptionConversation
  //     )
  //     .subscribe({

  //       next: (resp: any) => {

  //         this.plan = resp.data;

  //         console.log(
  //           'PLAN RESP ',
  //           resp.data
  //         );

  //         console.log(
  //           'PLAN ',
  //           this.plan.name
  //         );

  //         this.sections =
  //           resp.data.sections;

  //         console.log(
  //           'SectionS => ',
  //           this.sections
  //         );

  //         this.sectionProgress =
  //           this.sections.find(
  //             s =>
  //               s.progress?.status !==
  //               "completed"
  //           ) ?? null;

  //         this.questions =
  //           this.sectionProgress
  //             ?.questions ?? [];

  //         const lastSection =
  //           this.sections[
  //             this.sections.length - 1
  //           ] ?? null;

  //         if (
  //           lastSection?.progress?.status ===
  //           "completed"
  //         ) {

  //           this.finalizado = true;

  //           console.log(
  //             "Finalizado : {} ",
  //             this.finalizado
  //           );

  //         }

  //         console.log(
  //           'Section => ',
  //           this.sectionProgress
  //         );

  //         console.log(resp);

  //         console.log(
  //           "obtenerSectionPlan2 => " +
  //           this.idPlan
  //         );

  //       },

  //       error: (err: any) => {

  //         console.error(err);

  //       },

  //       complete: () => {

  //         console.log(
  //           'Completado'
  //         );

  //       }

  //     });

  // }


  // validarRespuestasDeInputs(): boolean {

  //   if (!this.sectionActual?.questions) {
  //     return false;
  //   }

  //   return this.sectionActual.questions.every(
  //     (_, i) =>
  //       this.answers[i] &&
  //       this.answers[i].trim().length > 0
  //   );

  // }

}

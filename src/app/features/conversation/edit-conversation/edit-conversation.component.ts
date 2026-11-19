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
  IaResponse,
  Source
} from 'src/app/core/models/IAResponse';
import { SourceModalComponent } from '../source-modal/source-modal.component';

import { ConversationPlanResponse, RestoredAnswer } from 'src/app/core/models/ConversationPlanResponse';

import { DomSanitizer } from '@angular/platform-browser';
import { ConversationFormService } from '../service/conversation-form.service';

import { AssistantModalComponent } from '../assistant-modal/assistant-modal.component';
import { ModificationModalComponent, ModificationResult } from '../modification-modal/modification-modal.component';
import { LoaderComponent } from 'src/app/components/loader/loader.component';

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
    MatProgressSpinnerModule,
    AssistantModalComponent,
    LoaderComponent
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

  @ViewChild('goBackDialog')
  goBackDialog!: TemplateRef<any>;

  // ============================================================
  // VARIABLES - CONVERSACIÓN
  // ============================================================

  idSuscriptionConversation!: number;
  idPlan!: number;
  idConversation!: number;

  // Variables para el modal de respuesta automática de la IA
  showAutoAnswerModal = false;
  autoSuggestedAnswer = '';
  autoSuggestedQuestion: any = null;

  dataCurrentQuestion!: ConversationPlanResponse;

  answers: string[] = [];

  reply: string = '';

  finalizado: boolean = false;

  questionsDiagnostic: any = [];

  isStructureLocked: boolean = false;

  // ============================================================
  // VARIABLES - FORMULARIO
  // ============================================================

  form!: FormGroup;

  isLoading = false;

  // Texto del indicador de carga: cambia según la acción (validar o guardar la sugerencia)
  loaderTitle = 'Validando información';
  loaderDescription = 'Analizando y estructurando tu respuesta. Esto tomará unos segundos...';

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

  fuentesAgregadas: Source[] = [];

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
  // VARIABLES - VOLVER A LA PREGUNTA ANTERIOR
  // ============================================================

  isGoingBack = false;

  // La pregunta se cargó con lo recuperado al volver: hay que validar antes de guardar
  modoRetroceso = false;

  // Archivos que tenía la respuesta anterior (hay que volver a adjuntarlos)
  archivosAnteriores: string[] = [];

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
    });

    this.obtenerDataConversation();
  }

  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  viewStructure() {
    if (this.isStructureLocked) {
      return;
    }

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

  irDeleteCapitulo() {

    this.router.navigate([
      '/conversations/delete-capitulo-conversation',
      this.idSuscriptionConversation
    ]);

  }

  irAnexos() {

    this.router.navigate([
      '/conversations/anexos',
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

  obtenerDataConversation(triggerAi: boolean = false) {

    this.conversationService
      .getDataConversation(this.idSuscriptionConversation, triggerAi)
      .subscribe({
        next: (resp: any) => {
          this.dataCurrentQuestion = resp;

          // Si se volvió a esta pregunta, cargar lo que escribió el usuario y su tabla
          this.aplicarRespuestaRecuperada(resp?.restored);

          // VERIFICAR SI LA IA PROPUSO UNA RESPUESTA AUTOMÁTICA PARA MOSTRAR EL MODAL
          if (resp && resp.auto_generated) {
            this.autoSuggestedAnswer = resp.suggested_answer || '';
            this.autoSuggestedQuestion = resp.question || resp.data?.question;
            this.showAutoAnswerModal = true; // Abrir modal
          } else {
            this.showAutoAnswerModal = false;
          }
        },
        error: (err: any) => {
          console.error(err);
        }
      });
  }

  confirmarRespuestaAutomatica() {
    if (!this.autoSuggestedAnswer || !this.dataCurrentQuestion?.question) return;

    this.loaderTitle = 'Guardando respuesta';
    this.loaderDescription = 'Esto tomará solo unos segundos…';
    this.isLoading = true;
    const conversationId = this.idSuscriptionConversation;
    const questionId = this.dataCurrentQuestion.question.id;
    const reply = this.autoSuggestedAnswer;

    // servicio para guardar directamente la respuesta automática
    this.conversationService.guardarRespuestas({
      idConversation: conversationId,
      idQuestion: questionId,
      reply: reply
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showAutoAnswerModal = false;
        this.autoSuggestedAnswer = '';
        // Continuar con la siguiente pregunta disparando la IA nuevamente
        this.obtenerDataConversation(true);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.showDialog('error', 'Error al guardar la respuesta automática.', 'Error');
      }
    });
  }

  // 2. EDITAR: Cierra el modal y pasa la pregunta/respuesta al primer textarea principal
  editarRespuestaAutomatica() {
    if (!this.autoSuggestedAnswer) return;

    // Asignar al formulario principal (primer textarea)
    this.form.patchValue({
      answer: this.autoSuggestedAnswer
    });

    this.form.get('answer')?.markAsDirty();
    this.form.get('answer')?.updateValueAndValidity();

    // Cerrar modal
    this.showAutoAnswerModal = false;
    this.autoSuggestedAnswer = '';
  }

  cerrarModalAutoRespuesta() {
    this.showAutoAnswerModal = false;
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

  // Tamaño máximo de cada imagen o Excel adjunto a la respuesta (el backend acepta hasta 20 MB)
  readonly MAX_ADJUNTO_MB = 20;

  // Deja fuera los archivos que superan el límite y avisa cuáles fueron
  private filtrarPorTamano(files: File[]): File[] {
    const maxBytes = this.MAX_ADJUNTO_MB * 1024 * 1024;
    const grandes = files.filter(file => file.size > maxBytes);

    if (grandes.length > 0) {
      const nombres = grandes.map(file => file.name).join(', ');
      this.showDialog(
        'info',
        `${nombres} supera el tamaño máximo de ${this.MAX_ADJUNTO_MB} MB y no se agregó.`,
        'Información'
      );
    }

    return files.filter(file => file.size <= maxBytes);
  }

  onFileSelectedAddDoc(event: any): void {

    const files: FileList = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    this.filtrarPorTamano(Array.from(files)).forEach(file => {

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

    const validFiles = this.filtrarPorTamano(allowedFiles);

    if (validFiles.length === 0) {
      return;
    }

    this.processFiles(validFiles);

  }

  private processFiles(files: File[]): void {

    files.forEach(file => {

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

    const respuesta =
      this.form.value.answer?.trim() || '';

    if (
      !respuesta &&
      this.selectedFiles.length == 0 &&
      this.fuentesAgregadas.length == 0
    ) {

      return this.showDialog(
        'error',
        'La respuesta es obligatoria',
        'Error'
      );

    }

    const formDataPayload =
      this.buildFormData('validate');

    this.iaResponse = null;

    this.reply = '';

    this.selectedFilesAddDoc = [];

    this.loaderTitle = 'Validando información';
    this.loaderDescription = 'Analizando y estructurando tu respuesta. Esto tomará unos segundos...';
    this.isLoading = true;
    this.urlImagenIA = '';

    this.conversationService .enviarContextoRespuestas(  formDataPayload )
      .subscribe({

        next: (resp: ChatResponse) => {

          this.iaResponse = resp.response;

          if (!resp.is_valid) {

            return this.showDialog(  'info', resp.feedback ?? '', 'Info'  );

          }

          this.reply = this.iaResponse.response ?? '';

          this.iaImageResponse =  resp.image ?? null;

          const predictionId =  this.iaImageResponse?.id;

          if (  this.iaImageResponse &&  ( this.iaImageResponse.status === 'processing' ||
                                            this.iaImageResponse.status === 'starting'
                                          ) &&  predictionId  ) {

            this.consultarImagenReplicate( predictionId  );

          }

          this.tablaGenerada = resp.table ?? null;

          this.prepararTabla();

        },

        error: (err: any) => {
          this.isLoading = false;
          console.error(err);

          // Sesión vencida: el interceptor ya lleva al login
          if (err?.status === 401) {
            return;
          }

          return this.showDialog(
            'info',
            this.mensajeErrorValidacion(err),
            'Info'
          );

        },

        complete: () => {

          this.isLoading = false;

        }

      });

  }

  // ============================================================
  // FORM DATA
  // ============================================================

  private buildFormData( tipo: string ): FormData | null  {

    const formData = new FormData();

    formData.append(  'idConversation', String(  this.idSuscriptionConversation ?? '' )  );

    formData.append(  'idQuestion',  String( this.dataCurrentQuestion.question?.id ?? '' ) );

    switch (tipo) {

      // --------------------------------------------------------
      // VALIDATE
      // --------------------------------------------------------

      case 'validate':

        formData.append(  'description',  this.dataCurrentQuestion  ?.parent_node ?.titulo || this.dataCurrentQuestion?.node?.titulo || 'General');

        formData.append( 'question', this.dataCurrentQuestion  ?.question ?.question_text ?? ''  );

        formData.append(  'detail', this.dataCurrentQuestion  ?.question ?.question_detail || ''  );

        formData.append( 'validation', this.dataCurrentQuestion  ?.question  ?.validation_detail || ''  );

        formData.append( 'response',  this.form.value.answer ?? ''  );

        formData.append(  'generate_table',  this.form.value.crearCuadro   ? '1'  : '0'  );

        formData.append( 'is_visual', this.form.value.showImages  ? '1'  : '0' );

        this.selectedFiles.forEach(file => {

          formData.append(  'files[]',  file, file.name );

        });

        if (this.fuentesAgregadas.length) {
          formData.append( 'sources', JSON.stringify( this.fuentesAgregadas ) );
        }

        break;

      // --------------------------------------------------------
      // SAVE
      // --------------------------------------------------------

      case 'save':
        if (!this.reply?.trim()) {

            this.showDialog(
                'info',
                'Debes ingresar una respuesta antes de continuar.',
                'Información'
            );

            return null;
        }

        formData.append(  'reply',  this.reply );

        const archivoInvalido = this.selectedFilesAddDoc.some(item =>
                                                                      !item.description?.trim() ||
                                                                      !item.fuente?.trim()
                                                                  );

        if (archivoInvalido) {

            this.showDialog(
                'info',
                'Debes completar la descripción y la fuente de todos los archivos.',
                'Información'
            );

            return null;
        }

        formData.append(  'metadata', JSON.stringify(  this.selectedFilesAddDoc.map(
                                                                                item => ({
                                                                                  description:  item.description,

                                                                                  fuente: item.fuente
                                                                                })
                                                                              )
          )
        );

        this.selectedFilesAddDoc.forEach(
          item => {

            formData.append( 'files[]', item.file, item.file.name  );

          }
        );

        formData.append(  'references',  JSON.stringify( this.iaResponse?.references ?? [] )  );

        formData.append(  'table',  JSON.stringify(  this.tablaGenerada  )  );

        if (  this.iaImageResponse?.status === 'succeeded' &&  this.iaImageResponse?.output?.length ) {

          if ( !this.descripcionImagenIA?.trim()) {
                   this.showDialog(
                    'info',
                    'Debes ingresar una descripción para la imagen generada.',
                    'Info'
                  );

                  return null;
          }

          formData.append(  'url_imagen_ia',  this.urlImagenIA );

          formData.append(  'desc_imagen_ia',  this.descripcionImagenIA ?? ''  );

        }

        break;

    }

    return formData;

  }

  // ============================================================
  // GUARDAR RESPUESTA
  // ============================================================

  guardarRespuesta() {

    // Al volver a una pregunta, la respuesta se debe validar de nuevo antes de guardarla
    if (this.modoRetroceso && !this.iaResponse) {
      this.showDialog(
        'info',
        'Antes de guardar, presiona "Validar información" para generar de nuevo la respuesta.',
        'Información'
      );
      return;
    }

    const formDataPayload = this.buildFormData('save');

    this.conversationService  .guardarRespuestas(  formDataPayload  )
      .subscribe({

        next: (resp: any) => {

          this.obtenerDataConversation(true);

          this.reply = '';

          this.answers = [];

          this.selectedFiles = [];

          this.fuentesAgregadas = [];

          this.form.reset();

          this.iaResponse = null;
          this.iaImageResponse = null;

          this.selectedFilesAddDoc = [];

          this.tablaGenerada = null;
          this.displayedTableColumns = [];

          /*
          this.form.reset({
            answer: '',
            showImages: true,
            citaApa: true,
            image: null,
            imageDescription: ''
          });
          */

        },

        // No se limpia nada: la respuesta y los archivos siguen en pantalla para corregir y reintentar
        error: (err: any) => {
          console.error(err);

          // Sesión vencida: el interceptor ya lleva al login
          if (err?.status === 401) {
            return;
          }

          this.showDialog(
            'info',
            err?.status === 422 && err?.error?.message
              ? err.error.message
              : 'No se pudo guardar la respuesta. Inténtalo de nuevo.',
            'Información'
          );
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

        this.conversationService .getReplicatePrediction( predictionId )
          .subscribe({

            next: (resp: any) => {

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

  // Mensaje breve según el error de "Validar información"
  abrirAgregarFuente(): void {
    if (!this.dataCurrentQuestion?.question) return;

    this.dialog.open(SourceModalComponent, {
      width: '620px',
      maxWidth: '95vw',
      data: {
        idConversation: this.idSuscriptionConversation
      }
    }).afterClosed().subscribe((fuentes: Source[] | undefined) => {
      // Sin repetir la misma fuente
      for (const fuente of fuentes ?? []) {
        if (!this.fuentesAgregadas.some(f => f.apa_text === fuente.apa_text)) {
          this.fuentesAgregadas.push(fuente);
        }
      }
    });
  }

  quitarFuente(index: number): void {
    this.fuentesAgregadas.splice(index, 1);
  }

  quitarReferencia(index: number): void {
    if (!this.iaResponse?.references) return;

    this.iaResponse.references = this.iaResponse.references.filter((_, i) => i !== index);
  }

  private mensajeErrorValidacion(err: any): string {
    // Sin conexión: desde el navegador (0) o desde el servidor hacia el servicio externo (503)
    if (err?.status === 0 || err?.status === 503) {
      return 'No se pudo conectar. Inténtalo de nuevo en unos segundos.';
    }

    // Archivo rechazado por tipo o tamaño
    if (err?.status === 422) {
      // Adjunto del que no se pudo obtener texto: el backend envía el mensaje
      if (err?.error?.file_error && err?.error?.message) {
        return err.error.message;
      }

      return 'El archivo no es válido. Solo se admiten archivos JPG, PNG, PDF, Word.';
    }

    return 'Ocurrió un error, estamos trabajando para solucionarlo';
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
  // VOLVER A LA PREGUNTA ANTERIOR
  // ============================================================

  volverPreguntaAnterior(): void {
    const goBack = this.dataCurrentQuestion?.go_back;

    if (!goBack?.allowed) {
      this.showDialog(
        'info',
        goBack?.reason ?? 'No es posible volver a la pregunta anterior.',
        'Información'
      );
      return;
    }

    this.dialog
      .open(this.goBackDialog, { width: '460px' })
      .afterClosed()
      .subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.confirmarVolverPreguntaAnterior();
        }
      });
  }

  private confirmarVolverPreguntaAnterior(): void {
    const questionId = this.dataCurrentQuestion?.question?.id;

    if (!questionId || this.isGoingBack) {
      return;
    }

    this.isGoingBack = true;

    this.conversationService.goBack(this.idSuscriptionConversation, questionId).subscribe({
      next: () => {
        this.isGoingBack = false;
        this.limpiarFormularioPregunta();
        // Sin IA: la pregunta anterior se carga con lo recuperado, sin respuesta automática
        this.obtenerDataConversation();
      },
      error: (err: any) => {
        this.isGoingBack = false;
        this.showDialog(
          'info',
          err?.error?.message ?? 'No se pudo volver a la pregunta anterior.',
          'Información'
        );
        this.obtenerDataConversation();
      }
    });
  }

  private aplicarRespuestaRecuperada(restored: RestoredAnswer | null | undefined): void {
    this.modoRetroceso = !!restored;

    if (!restored) {
      this.archivosAnteriores = [];
      return;
    }

    // Primer cuadro con lo que escribió; el segundo queda vacío hasta validar
    this.form.patchValue({
      answer: restored.user_input ?? '',
      showImages: false,
      crearCuadro: false
    });
    this.reply = '';
    this.iaResponse = null;

    this.archivosAnteriores = restored.files ?? [];

    // Se muestra la tabla que tenía; al validar sigue a la casilla "Generar cuadro"
    this.tablaGenerada = restored.table ?? null;
    this.prepararTabla();
  }

  // Deja la pregunta como nueva (lo mismo que se limpia después de guardar)
  private limpiarFormularioPregunta(): void {
    this.reply = '';
    this.fuentesAgregadas = [];
    this.answers = [];
    this.selectedFiles = [];
    this.previewFiles = [];
    this.selectedFilesAddDoc = [];
    this.form.reset();
    this.iaResponse = null;
    this.iaImageResponse = null;
    this.urlImagenIA = '';
    this.descripcionImagenIA = '';
    this.tablaGenerada = null;
    this.displayedTableColumns = [];
    this.modoRetroceso = false;
    this.archivosAnteriores = [];
  }

  // ELIMINAR TABLA
  eliminarTabla(): void {

      this.tablaGenerada = null;

      this.displayedTableColumns = [];

      this.dialog.closeAll();
  }

  // ABRIR MODAL 
  // "Modificar respuesta": modificar una respuesta ya guardada de cualquier capítulo sin salir de la pregunta actual
  abrirModificarRespuesta(): void {
    this.dialog.open(ModificationModalComponent, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data: { idConversation: this.idSuscriptionConversation }
    }).afterClosed().subscribe((result: ModificationResult | undefined) => {
      if (!result) return;

      if (result.type === 'menor') {
        this.showDialog('success', 'Tu respuesta se modificó correctamente. Puedes continuar con tu pregunta actual.', 'Respuesta modificada');
        return;
      }

      // De fondo: lo posterior se borró; se continúa desde la pregunta siguiente a la corregida
      this.limpiarFormularioPregunta();
      this.obtenerDataConversation();
      this.showDialog('info', 'Tu respuesta se modificó y se eliminó lo desarrollado después de ella. Continúa desde la pregunta siguiente.', 'Respuesta modificada');
    });
  }

  abrirAsistenteIA(): void {
    if (!this.dataCurrentQuestion?.question) return;

    const dialogRef = this.dialog.open(AssistantModalComponent, {
      width: '84vw',
      maxWidth: '88vw',
      height: '88vh',
      disableClose: true,
      data: {
        idConversation: this.idSuscriptionConversation,
        question: this.dataCurrentQuestion.question,
        parentNode: this.dataCurrentQuestion.parent_node,
        currentAnswer: this.form.get('answer')?.value ?? ''
      }
    });

    dialogRef.afterClosed().subscribe((resultText: string) => {
      if (resultText && resultText.trim()) {
        const text = resultText.trim();

        this.form.patchValue({ answer: text });
        
        this.form.get('answer')?.markAsDirty();
        this.form.get('answer')?.updateValueAndValidity();

        // 3. Limpiar el segundo textarea
        this.reply = '';
      }
    });
  }

}

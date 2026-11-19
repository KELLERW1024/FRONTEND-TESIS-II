import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  DestroyRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from '../service/conversation.service';
import { CalculatorPanelComponent } from './calculator-panel/calculator-panel.component';

export interface AssistantModalData {
  idConversation: number;
  question: any;
  parentNode: any;
  currentAnswer?: string;
}

// INTERFACES PARA EL SUPER-MODAL
export interface Brecha {
  dato: string;
  criticidad: 'Crítica' | 'Importante' | 'Recomendable' | 'Opcional' | string;
}

export interface VariableNegocio {
  nombre: string;
  valor: string;
  estado: 'Calculado' | 'Supuesto' | string;
  formula?: string | null;
  mostrarFormula?: boolean;
}

@Component({
  selector: 'app-assistant-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CalculatorPanelComponent
  ],
  templateUrl: './assistant-modal.component.html',
  styleUrls: ['./assistant-modal.component.scss']
})
export class AssistantModalComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatScrollContainer') private chatContainer!: ElementRef<HTMLDivElement>;

  private destroyRef = inject(DestroyRef);

  messages: { role: 'user' | 'assistant'; content: string }[] = [];
  userInput: string = '';
  draftText: string = '';
  metricsSummary: string | null = null;
  progressPercentage: number = 0;
  isComplete: boolean = false;
  isLoading: boolean = false;
  contextoGeneral: string = '';
  private shouldScrollToBottom: boolean = false;
  mostrarCalculadoraPanel: boolean = false;

  // ESTADOS DEL SUPER-MODAL
  brechas: Brecha[] = [];
  variables: VariableNegocio[] = [];
  
  // DATOS YA CONOCIDOS (Memoria Inmutable)
  datosConocidos: { clave: string, nombre: string, valor: string }[] = [];

  // ARCHIVOS ADJUNTOS: se leen una sola vez y su texto viaja en cada mensaje del chat.
  // Como en "Agregar archivo como respuesta": una imagen y un documento como máximo
  adjuntos: { name: string; type: 'image' | 'document'; text: string; truncated: boolean }[] = [];
  isReadingFile: boolean = false;
  fileError: string = '';
  private readonly MAX_ADJUNTO_MB = 5;
  private readonly EXTENSIONES = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

  // Confirmación antes de integrar una propuesta incompleta (< 100 %)
  showIntegrateConfirm: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AssistantModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssistantModalData,
    private conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.sendInitialPrompt();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  sendInitialPrompt(): void {
    this.isLoading = true;
    this.conversationService.assistantChat({
      idConversation: this.data.idConversation,
      idQuestion: this.data.question.id,
      messages: [],
      current_answer: this.data.currentAnswer ?? '',
      attachments: this.attachmentsPayload()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.applyAiResponse(resp.data);
          this.shouldScrollToBottom = true;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    this.userInput = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.conversationService.assistantChat({
      idConversation: this.data.idConversation,
      idQuestion: this.data.question.id,
      messages: this.messages,
      user_message: text,
      current_answer: this.data.currentAnswer ?? '',
      attachments: this.attachmentsPayload()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp.success && resp.data) {
          this.applyAiResponse(resp.data);
          this.shouldScrollToBottom = true;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private applyAiResponse(data: any): void {
    
    if (data.chat_message) {
      this.messages.push({ role: 'assistant', content: data.chat_message });
    }
    if (data.draft_text) {
      this.draftText = data.draft_text;
    }

    this.contextoGeneral = data.contexto_general || '';
    
    this.metricsSummary = data.metrics_summary;
    this.isComplete = data.is_complete;
    this.progressPercentage = data.progress_percentage || 0;

    // La propuesta cambió: la confirmación anterior ya no aplica
    this.showIntegrateConfirm = false;

    // MAPEO DE BRECHAS
    this.brechas = data.brechas_detectadas || [];
    
    // MAPEO DE VARIABLES CON FÓRMULAS INDIVIDUALES
    this.variables = (data.variables_negocio || []).map((v: any) => ({
      nombre: v.nombre ? v.nombre.replace(/_/g, ' ') : '',
      valor: v.valor,
      estado: v.estado,
      formula: v.formula || null,
      mostrarFormula: false // Inicia oculta
    }));
    
    // DATOS YA CONOCIDOS: el backend envía solo los datos con valor del catálogo del plan,
    this.setDatosConocidos(data.datos_conocidos);
  }

  private setDatosConocidos(raw: any): void {
    const rawDatos: { key: string, label: string, value: string }[] = Array.isArray(raw) ? raw : [];
    this.datosConocidos = rawDatos.map(d => ({
      clave: d.key,
      nombre: d.label,
      valor: d.value
    }));
  }

  recalculate(): void {
    this.messages = [];
    this.draftText = '';
    this.metricsSummary = null;
    this.progressPercentage = 0;
    this.isComplete = false;
    this.brechas = [];
    this.variables = [];
    this.datosConocidos = [];
    this.showIntegrateConfirm = false;
    this.sendInitialPrompt();
  }

  // "Aprobar e Integrar": si la propuesta no está completa, primero se muestra
  // un aviso y el usuario decide si integra de todos modos
  approveAnswer(): void {
    if (this.isComplete) {
      this.useAnswer();
      return;
    }

    this.showIntegrateConfirm = true;
  }

  cancelIntegrate(): void {
    this.showIntegrateConfirm = false;
  }

  useAnswer(): void {
    this.dialogRef.close(this.draftText);
  }

  // NUEVO MÉTODO: Alterna la visibilidad de la fórmula por cada variable
  toggleFormulaVariable(index: number): void {
    if (this.variables[index]) {
      this.variables[index].mostrarFormula = !this.variables[index].mostrarFormula;
    }
  }

abrirCalculadora(): void {
    this.mostrarCalculadoraPanel = true;
  }

  cerrarCalculadora(): void {
    this.mostrarCalculadoraPanel = false;
  }

  recibirDatosCalculadora(mensaje: string): void {
    this.mostrarCalculadoraPanel = false;
    this.userInput = mensaje;
    this.sendMessage(); // Lo enviamos a la IA automáticamente
  }

  // "Subir archivo": se lee con el mismo servicio que "Agregar archivo como respuesta"
  subirArchivo(): void {
    if (this.isReadingFile || this.isLoading) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.EXTENSIONES.map(ext => '.' + ext).join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) this.leerArchivo(file);
    };
    input.click();
  }

  private leerArchivo(file: File): void {
    this.fileError = '';

    const extension = (file.name.split('.').pop() ?? '').toLowerCase();
    const type: 'image' | 'document' = ['jpg', 'jpeg', 'png'].includes(extension) ? 'image' : 'document';

    if (!this.EXTENSIONES.includes(extension)) {
      this.fileError = 'Usa JPG, PNG, PDF, Word o Excel.';
      return;
    }

    if (file.size > this.MAX_ADJUNTO_MB * 1024 * 1024) {
      this.fileError = `El archivo supera ${this.MAX_ADJUNTO_MB} MB.`;
      return;
    }

    if (this.adjuntos.some(a => a.type === type)) {
      this.fileError = type === 'image'
        ? 'Ya adjuntaste una imagen. Quítala para subir otra.'
        : 'Ya adjuntaste un documento. Quítalo para subir otro.';
      return;
    }

    const formData = new FormData();
    formData.append('idConversation', String(this.data.idConversation));
    formData.append('idQuestion', String(this.data.question.id));
    formData.append('file', file, file.name);

    this.isReadingFile = true;

    this.conversationService.readAssistantAttachment(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp: any) => {
          this.isReadingFile = false;
          const data = resp?.data;
          if (!data) return;

          this.adjuntos.push({ name: data.name, type: data.type, text: data.text, truncated: !!data.truncated });
          this.setDatosConocidos(data.datos_conocidos);

          // El asistente revisa el archivo de inmediato
          this.userInput = `Adjunté el archivo "${data.name}". Revisa su información.`;
          this.sendMessage();
        },
        error: (err) => {
          this.isReadingFile = false;
          this.fileError = (err?.status === 422 || err?.status === 503) && err?.error?.message && !err?.error?.errors
            ? err.error.message
            : err?.status === 422
              ? 'El archivo no es válido. Usa JPG, PNG, PDF, Word o Excel de hasta 5 MB.'
              : 'No se pudo leer el archivo. Inténtalo de nuevo.';
        }
      });
  }

  quitarAdjunto(index: number): void {
    this.adjuntos.splice(index, 1);
  }

  private attachmentsPayload(): { name: string; text: string }[] {
    return this.adjuntos.map(a => ({ name: a.name, text: a.text }));
  }
  
  actionEstimarIA(): void {
    this.userInput = "No conozco el dato exacto, ¿puedes estimarlo según el rubro?";
    this.sendMessage();
  }
}
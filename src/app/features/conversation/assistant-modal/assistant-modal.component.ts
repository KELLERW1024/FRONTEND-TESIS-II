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
  datosConocidos: { nombre: string, valor: string }[] = [];

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
      messages: []
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
      user_message: text
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
    
    // MAPEO DE DATOS YA CONOCIDOS (Limpiando nulos y formateando claves)
    const rawDatos = data.datos_conocidos || {};
    this.datosConocidos = Object.keys(rawDatos)
      .filter(key => rawDatos[key] !== null && rawDatos[key] !== '')
      .map(key => ({
        nombre: key.replace(/_/g, ' '), // Cambia guiones_bajos a espacios
        valor: rawDatos[key]
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

  subirArchivo(): void {
    // TODO: Aquí integraremos la lógica para seleccionar y procesar archivos
    console.log('Abrir selector de archivos...');
  }
  
  actionEstimarIA(): void {
    this.userInput = "No conozco el dato exacto, ¿puedes estimarlo según el rubro?";
    this.sendMessage();
  }
}
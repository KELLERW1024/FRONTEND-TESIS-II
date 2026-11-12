import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
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
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';

// Una pregunta de un nodo, con su posición en el orden en que se responden
export interface QuestionRow {
  id: number;
  text: string;
  index: number;
  answered: boolean;
}

// Un nodo de la Fase 1 (capítulo, sección o subsección) en el árbol de selección
export interface NodeRow {
  id: number;
  titulo: string;
  codigo: string | null;
  depth: number;
  // Rango de sus preguntas (y las de sus subnodos) en el orden en que se responden; -1 si no tiene
  firstQuestion: number;
  lastQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  // Preguntas propias del nodo (sin las de sus subnodos), visibles al desplegarlo
  questions: QuestionRow[];
  expanded: boolean;
}

// Punto desde el que se borra: un nodo (desde su primera pregunta) o una pregunta
export interface DeleteStart {
  nodeId?: number;
  questionId?: number;
  label: string;
  index: number;
}

export interface ChapterGroup {
  chapter: NodeRow;
  sections: NodeRow[];
  expanded: boolean;
}

// Cómo queda un nodo con el nodo de inicio elegido
export type RowState = 'keep' | 'delete' | 'partial';

@Component({
  selector: 'app-delete-capitulo-conversation',
  imports: [MatTableModule,
    CommonModule,
    MatCardModule,
    MaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterLink, ReactiveFormsModule ,   FormsModule, 	MatExpansionModule, TablerIconsModule, MatCardModule, MatRadioModule, FormsModule, MatCheckboxModule, MatSlideToggleModule, MatProgressSpinnerModule],
  templateUrl: './delete-capitulo-conversation.component.html',
  styleUrl: './delete-capitulo-conversation.component.scss',
})
export class DeleteCapituloConversationComponent {

  checked = false;
  disabled = false;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  idSuscriptionConversation!: number;
  plan!: Plan;
  sections: Section[] = [];

  showModal = false;
  selectedQuestion: any;

  // ============================================================
  // ELIMINACIÓN EN CASCADA DESDE UN NODO
  // Se borra desde el nodo elegido hasta el final, en el orden en que se responden.
  // Solo se muestran los nodos de la Fase 1; las respuestas de la Fase 2 se borran
  // también en el backend para que se generen de nuevo.
  // ============================================================
  chapters: ChapterGroup[] = [];
  seleccion: DeleteStart | null = null;
  isLoading = false;
  isDeleting = false;

  // Preguntas de la Fase 1 en el orden en que se responden: true si tiene respuesta
  private answeredInOrder: boolean[] = [];

  // Respuestas de la Fase 2 (resumen ejecutivo, introducción, conclusiones, recomendaciones)
  phase2Answered = 0;

  constructor(
  private router: Router , private route: ActivatedRoute, private conversationService: ConversationService,
  private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idSuscriptionConversation = params['id'];
    });

    this.obtenerCapitulos();
  }

  obtenerCapitulos() {
    this.isLoading = true;

    this.conversationService.getViewConversationPlanUser(this.idSuscriptionConversation).subscribe({
      next: (resp: any) => {
        const nodes: any[] = resp.data || [];
        this.construirArbol(nodes);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Recorre la estructura en el mismo orden que el backend: nodos por orden e id,
  // primero las preguntas del nodo y después las de sus subnodos, en todos los niveles
  private construirArbol(nodes: any[]) {
    const byOrder = (a: any, b: any) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id;
    const hasAnswer = (q: any) => !!q.answer?.answer_text && q.answer.answer_text.trim() !== '';

    const childrenByParent = new Map<number | null, any[]>();
    nodes.forEach(node => {
      const parentId = node.parent_id ?? null;
      childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), node]);
    });

    this.answeredInOrder = [];

    const visit = (node: any, depth: number, rows: NodeRow[]): NodeRow => {
      const row: NodeRow = {
        id: node.id,
        titulo: node.titulo,
        codigo: node.codigo ?? null,
        depth,
        firstQuestion: this.answeredInOrder.length,
        lastQuestion: -1,
        totalQuestions: 0,
        answeredQuestions: 0,
        questions: [],
        expanded: false
      };
      rows.push(row);

      (node.questions || [])
        .slice()
        .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .forEach((q: any) => {
          row.questions.push({
            id: q.id,
            text: q.question_text,
            index: this.answeredInOrder.length,
            answered: hasAnswer(q)
          });
          this.answeredInOrder.push(hasAnswer(q));
        });

      (childrenByParent.get(node.id) ?? []).slice().sort(byOrder)
        .forEach(child => visit(child, depth + 1, rows));

      row.lastQuestion = this.answeredInOrder.length - 1;
      if (row.lastQuestion < row.firstQuestion) {
        row.firstQuestion = -1;
        row.lastQuestion = -1;
      } else {
        const range = this.answeredInOrder.slice(row.firstQuestion, row.lastQuestion + 1);
        row.totalQuestions = range.length;
        row.answeredQuestions = range.filter(Boolean).length;
      }

      return row;
    };

    const roots = (childrenByParent.get(null) ?? []).slice().sort(byOrder);

    this.chapters = roots
      .filter(root => Number(root.execution_phase) === 1)
      .map(root => {
        const rows: NodeRow[] = [];
        const chapter = visit(root, 0, rows);
        return {
          chapter,
          sections: rows.slice(1),
          expanded: chapter.answeredQuestions > 0
        };
      });

    // La Fase 2 no se muestra; solo se cuenta para avisarlo en la confirmación
    this.phase2Answered = 0;
    const countPhase2 = (node: any) => {
      this.phase2Answered += (node.questions || []).filter(hasAnswer).length;
      (childrenByParent.get(node.id) ?? []).forEach(countPhase2);
    };
    roots.filter(root => Number(root.execution_phase) === 2).forEach(countPhase2);

    this.seleccion = null;
  }

  // Solo se puede elegir un nodo que tenga respuestas
  puedeSeleccionar(row: NodeRow): boolean {
    return row.answeredQuestions > 0;
  }

  // Elegir un nodo equivale a elegir su primera pregunta
  seleccionarNodo(row: NodeRow) {
    if (!this.puedeSeleccionar(row)) return;

    this.seleccion = {
      nodeId: row.id,
      label: row.codigo ? `${row.codigo} ${row.titulo}` : row.titulo,
      index: row.firstQuestion
    };
  }

  // Solo se puede elegir una pregunta que tenga respuesta
  seleccionarPregunta(row: NodeRow, question: QuestionRow) {
    if (!question.answered) return;

    const posicion = row.questions.indexOf(question) + 1;

    this.seleccion = {
      questionId: question.id,
      label: `la pregunta ${posicion} de ${row.codigo ? row.codigo + ' ' : ''}${row.titulo}`,
      index: question.index
    };
  }

  estaSeleccionadoNodo(row: NodeRow): boolean {
    return this.seleccion?.nodeId === row.id;
  }

  estaSeleccionadaPregunta(question: QuestionRow): boolean {
    return this.seleccion?.questionId === question.id;
  }

  estadoNodo(row: NodeRow): RowState {
    if (!this.seleccion || row.firstQuestion === -1) return 'keep';

    const start = this.seleccion.index;

    if (row.lastQuestion < start) return 'keep';
    if (row.firstQuestion >= start) return 'delete';
    return 'partial';
  }

  seEliminaPregunta(question: QuestionRow): boolean {
    return !!this.seleccion && question.index >= this.seleccion.index;
  }

  // Respuestas de la Fase 1 que se borrarán desde el punto elegido
  get respuestasAEliminar(): number {
    if (!this.seleccion) return 0;
    return this.answeredInOrder.slice(this.seleccion.index).filter(Boolean).length;
  }

  toggleCapitulo(group: ChapterGroup) {
    group.expanded = !group.expanded;
  }

  togglePreguntas(row: NodeRow) {
    row.expanded = !row.expanded;
  }

  abrirConfirmacion() {
    if (!this.seleccion) return;
    this.showModal = true;
  }

  confirmarEliminacion() {
    if (!this.seleccion) return;

    this.isDeleting = true;

    const start = this.seleccion.questionId
      ? { startQuestionId: this.seleccion.questionId }
      : { startNodeId: this.seleccion.nodeId };

    this.conversationService.deleteChaptersAnswers(
      this.idSuscriptionConversation,
      start
    ).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showModal = false;

        const dialogRef = this.dialog.open(DialogComponent, {
          width: '400px',
          data: {
            type: 'success',
            title: 'Respuestas eliminadas',
            message: 'Se eliminaron las respuestas. Ahora puedes volver a desarrollar desde la sección seleccionada.',
            confirmText: 'Continuar'
          }
        });

        dialogRef.afterClosed().subscribe(() => {
          this.volverADesarrollo();
        });
      },
      error: (err) => {
        console.error(err);
        this.isDeleting = false;
        this.showModal = false;

        this.dialog.open(DialogComponent, {
          width: '400px',
          data: {
            type: 'error',
            title: 'Error',
            message: err?.error?.message ?? 'No se pudieron eliminar las respuestas. Inténtalo nuevamente.',
            confirmText: 'Aceptar'
          }
        });
      }
    });
  }

  volverADesarrollo() {
    this.router.navigate(['/conversations/edit', this.idSuscriptionConversation]);
  }
}

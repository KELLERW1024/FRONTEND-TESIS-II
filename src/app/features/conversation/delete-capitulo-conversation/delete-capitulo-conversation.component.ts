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

export interface ChapterSummary {
  id: number;
  titulo: string;
  orden: number;
  execution_phase: number;
  totalQuestions: number;
  answeredQuestions: number;
  checked: boolean;
  cascadeLocked: boolean;
}

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
  // ELIMINACIÓN EN CASCADA POR CAPÍTULOS
  // ============================================================
  chapters: ChapterSummary[] = [];
  selectedStartChapter: ChapterSummary | null = null;
  isLoading = false;
  isDeleting = false;
    
  constructor( 
  private router: Router , private route: ActivatedRoute, private conversationService: ConversationService,
  private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.idSuscriptionConversation = params['id'];
    });

    console.log("ONIT => " + this.idSuscriptionConversation)
    this.obtenerCapitulos();
  }

  // ============================================================
  // ELIMINACIÓN EN CASCADA POR CAPÍTULOS
  // ============================================================

  obtenerCapitulos() {
    this.isLoading = true;

    this.conversationService.getViewConversationPlanUser(this.idSuscriptionConversation).subscribe({
      next: (resp: any) => {
        const nodes: any[] = resp.data || [];
        this.construirResumenCapitulos(nodes);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  private construirResumenCapitulos(nodes: any[]) {
    // Filtramos únicamente los capítulos de Fase 1
    const rootNodes = nodes
      .filter(n => n.parent_id === null && Number(n.execution_phase) === 1)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);

    this.chapters = rootNodes.map(root => {
      // Buscar subnodos nivel 2 y nivel 3 que pertenecen a este capítulo
      const level2Ids = nodes.filter(n => n.parent_id === root.id).map(n => n.id);
      const level3Ids = nodes.filter(n => level2Ids.includes(n.parent_id)).map(n => n.id);
      const allChapterNodeIds = [root.id, ...level2Ids, ...level3Ids];

      const chapterNodes = nodes.filter(n => allChapterNodeIds.includes(n.id));

      let totalQuestions = 0;
      let answeredQuestions = 0;

      chapterNodes.forEach(node => {
        const questions = node.questions || [];
        totalQuestions += questions.length;
        questions.forEach((q: any) => {
          if (q.answer && q.answer.answer_text && q.answer.answer_text.trim() !== '') {
            answeredQuestions++;
          }
        });
      });

      return {
        id: root.id,
        titulo: root.titulo,
        orden: root.orden,
        execution_phase: root.execution_phase,
        totalQuestions,
        answeredQuestions,
        checked: false,
        cascadeLocked: false
      };
    });
  }

  onToggleChapter(index: number, isChecked: boolean) {
    if (isChecked) {
      this.selectedStartChapter = this.chapters[index];

      this.chapters.forEach((cap, i) => {
        if (i < index) {
          cap.checked = false;
          cap.cascadeLocked = false;
        } else if (i === index) {
          cap.checked = true;
          cap.cascadeLocked = false;
        } else {
          cap.checked = true;
          cap.cascadeLocked = true;
        }
      });
    } else {
      this.selectedStartChapter = null;
      this.chapters.forEach(cap => {
        cap.checked = false;
        cap.cascadeLocked = false;
      });
    }
  }

  get selectedChaptersList(): ChapterSummary[] {
    return this.chapters.filter(c => c.checked && c.answeredQuestions > 0);
  }

  abrirConfirmacion() {
    if (!this.selectedStartChapter) return;
    this.showModal = true;
  }

  confirmarEliminacion() {
    if (!this.selectedStartChapter) return;

    this.isDeleting = true;

    this.conversationService.deleteChaptersAnswers(
      this.idSuscriptionConversation,
      this.selectedStartChapter.id
    ).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showModal = false;

        const dialogRef = this.dialog.open(DialogComponent, {
          width: '400px',
          data: {
            type: 'success',
            title: 'Respuestas eliminadas',
            message: 'Se han vaciado las respuestas correctamente. Ahora puedes volver a desarrollar desde el capítulo seleccionado.',
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
            message: 'No se pudieron eliminar las respuestas. Inténtalo nuevamente.',
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
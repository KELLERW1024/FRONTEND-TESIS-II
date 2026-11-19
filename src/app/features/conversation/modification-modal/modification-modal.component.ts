import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConversationService } from '../service/conversation.service';

interface ModificationQuestion {
  id: number;
  text: string;
  section: string;
}

interface ModificationChapter {
  chapter_id: number;
  chapter: string;
  questions: ModificationQuestion[];
}

interface ModificationAnswer {
  question_id: number;
  question: string;
  section: string;
  answer_text: string;
  has_table: boolean;
  has_files: boolean;
}

export interface ModificationResult {
  type: 'menor' | 'fondo';
  deleted_answers_count: number;
}

@Component({
  selector: 'app-modification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './modification-modal.component.html'
})
export class ModificationModalComponent implements OnInit {

  step: 'select' | 'edit' | 'result' | 'sure' = 'select';
  isLoading = false;
  errorMessage = '';

  chapters: ModificationChapter[] = [];
  openChapterId: number | null = null;

  answer: ModificationAnswer | null = null;
  text = '';

  // Resultado de "Validar"
  resultType: 'invalido' | 'menor' | 'fondo' | null = null;
  resultMessage = '';

  constructor(
    private dialogRef: MatDialogRef<ModificationModalComponent, ModificationResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: { idConversation: number },
    private conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.conversationService.modificationQuestions(this.data.idConversation).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.chapters = res?.data?.chapters ?? [];
        this.openChapterId = this.chapters.length ? this.chapters[this.chapters.length - 1].chapter_id : null;
      },
      error: (err: any) => this.fail(err, 'No se pudieron cargar tus respuestas.')
    });
  }

  toggleChapter(chapterId: number): void {
    this.openChapterId = this.openChapterId === chapterId ? null : chapterId;
  }

  selectQuestion(question: ModificationQuestion): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.conversationService.modificationAnswer(this.data.idConversation, question.id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.answer = res?.data ?? null;
        this.text = this.answer?.answer_text ?? '';
        this.step = 'edit';
      },
      error: (err: any) => this.fail(err, 'No se pudo cargar la respuesta.')
    });
  }

  backToList(): void {
    this.step = 'select';
    this.answer = null;
    this.errorMessage = '';
  }

  get unchanged(): boolean {
    return this.normalize(this.text) === this.normalize(this.answer?.answer_text ?? '');
  }

  // "Validar": revisiones del validador (sin generar texto) + si el cambio influye en lo avanzado
  validate(): void {
    if (!this.answer || this.isLoading || this.unchanged || !this.text.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.conversationService.modificationAnalyze(this.data.idConversation, this.answer.question_id, this.text).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const type = res?.data?.type;

        if (type === 'sin_cambios') {
          this.errorMessage = 'No realizaste cambios en la respuesta.';
          return;
        }

        this.resultType = type === 'invalido' || type === 'menor' ? type : 'fondo';
        this.resultMessage = res?.data?.message ?? '';
        this.step = 'result';
      },
      error: (err: any) => this.fail(err, 'No se pudo validar la respuesta modificada.')
    });
  }

  backToEdit(): void {
    this.step = 'edit';
    this.resultType = null;
    this.resultMessage = '';
    this.errorMessage = '';
  }

  // Confirmar: si influye en lo avanzado, primero la alerta de que la acción no se puede deshacer
  confirm(): void {
    if (this.resultType === 'fondo' && this.step === 'result') {
      this.step = 'sure';
      return;
    }

    this.save();
  }

  private save(): void {
    if (!this.answer || (this.resultType !== 'menor' && this.resultType !== 'fondo') || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    const type = this.resultType;

    this.conversationService.modificationSave(this.data.idConversation, this.answer.question_id, this.text, type).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.dialogRef.close({ type, deleted_answers_count: res?.data?.deleted_answers_count ?? 0 });
      },
      error: (err: any) => this.fail(err, 'No se pudo guardar la respuesta modificada.')
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private fail(err: any, fallback: string): void {
    this.isLoading = false;
    this.errorMessage = err?.error?.message ?? fallback;
  }

  private normalize(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}

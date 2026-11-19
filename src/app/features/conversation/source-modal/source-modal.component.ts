import { Component, DestroyRef, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from '../service/conversation.service';
import { Source } from 'src/app/core/models/IAResponse';

export interface SourceModalData {
  idConversation: number;
}

type Scope = 'official' | 'academic';

@Component({
  selector: 'app-source-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './source-modal.component.html',
})
export class SourceModalComponent {
  private destroyRef = inject(DestroyRef);

  tab: 'manual' | 'search' = 'manual';

  readonly tipos = [
    { value: 'web_page', label: 'Página web' },
    { value: 'report', label: 'Informe o documento institucional' },
    { value: 'book', label: 'Libro' },
    { value: 'journal_article', label: 'Artículo de revista' },
    { value: 'thesis', label: 'Tesis' },
    { value: 'conference_paper', label: 'Ponencia' },
  ];

  // Fuente a mano
  manual = {
    source_type: 'web_page',
    author: '',
    otherAuthors: '',
    year: '',
    title: '',
    container_title: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    url: '',
    doi: '',
    excerpt: '',
  };
  manualError = '';
  isSaving = false;

  // Búsqueda
  query = '';
  scope: Scope = 'official';
  results: Source[] = [];
  selected = new Set<number>();
  searched = false;
  searchError = '';
  isSearching = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SourceModalData,
    private dialogRef: MatDialogRef<SourceModalComponent, Source[]>,
    private conversationService: ConversationService,
  ) {}

  get esArticulo(): boolean {
    return this.manual.source_type === 'journal_article';
  }

  get usaSitio(): boolean {
    return this.manual.source_type === 'web_page' || this.esArticulo;
  }

  get usaEditorial(): boolean {
    return ['book', 'report', 'thesis', 'conference_paper'].includes(this.manual.source_type);
  }

  get etiquetaEditorial(): string {
    switch (this.manual.source_type) {
      case 'thesis': return 'Universidad';
      case 'book': return 'Editorial';
      default: return 'Institución que publica';
    }
  }

  agregarManual(): void {
    this.manualError = '';

    if (!this.manual.author.trim() || !this.manual.title.trim()) {
      this.manualError = 'Completa el autor o la institución y el título de la fuente.';
      return;
    }

    const authors = [this.manual.author, ...this.manual.otherAuthors.split(';')]
      .map(a => a.trim())
      .filter(a => a);

    const payload = {
      authors,
      year: this.manual.year.trim(),
      title: this.manual.title.trim(),
      source_type: this.manual.source_type,
      container_title: this.usaSitio ? this.manual.container_title.trim() : '',
      volume: this.esArticulo ? this.manual.volume.trim() : '',
      issue: this.esArticulo ? this.manual.issue.trim() : '',
      pages: this.esArticulo ? this.manual.pages.trim() : '',
      publisher: this.usaEditorial ? this.manual.publisher.trim() : '',
      url: this.manual.url.trim() || null,
      doi: this.manual.doi.trim(),
      excerpt: this.manual.excerpt.trim(),
    };

    this.isSaving = true;

    this.conversationService.formatSource(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          this.dialogRef.close([resp.data as Source]);
        },
        error: (err) => {
          this.isSaving = false;
          this.manualError = err?.status === 422
            ? (err?.error?.errors?.url ? 'El enlace no es válido. Debe empezar con http:// o https://' : (err?.error?.message ?? 'Revisa los datos de la fuente.'))
            : 'No se pudo agregar la fuente. Inténtalo de nuevo.';
        },
      });
  }

  buscar(): void {
    const query = this.query.trim();

    if (query.length < 3 || this.isSearching) {
      return;
    }

    this.isSearching = true;
    this.searchError = '';
    this.results = [];
    this.selected.clear();

    this.conversationService.searchSources({ idConversation: this.data.idConversation, query, scope: this.scope })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp: any) => {
          this.isSearching = false;
          this.searched = true;
          this.results = resp?.data ?? [];
        },
        error: (err) => {
          this.isSearching = false;
          this.searched = true;
          this.searchError = (err?.status === 429 || err?.status === 503) && err?.error?.message
            ? err.error.message
            : 'No se pudo completar la búsqueda. Inténtalo de nuevo en unos segundos.';
        },
      });
  }

  toggle(index: number): void {
    this.selected.has(index) ? this.selected.delete(index) : this.selected.add(index);
  }

  agregarSeleccionadas(): void {
    this.dialogRef.close(this.results.filter((_, i) => this.selected.has(i)));
  }

  enlace(source: Source): string | null {
    if (source.doi) return 'https://doi.org/' + source.doi;
    return source.url ?? null;
  }

  cerrar(): void {
    this.dialogRef.close([]);
  }
}

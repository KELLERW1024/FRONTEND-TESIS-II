import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { DialogComponent } from 'src/app/components/dialog/dialog.component';
import { ConversationService } from '../service/conversation.service';

export interface Annex {
  id: number;
  title: string;
  source: string | null;
  type: 'image' | 'excel';
  url: string;
}

/**
 * Anexos del plan: imágenes o Excel que se agregan al final del documento.
 * Solo se pueden agregar cuando el plan está completo. Se numeran según su posición en la lista.
 */
@Component({
  selector: 'app-anexos-conversation',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './anexos-conversation.component.html',
})
export class AnexosConversationComponent implements OnInit {

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  // Tamaño máximo por archivo (el backend acepta hasta 20 MB)
  readonly MAX_MB = 20;

  idConversation!: number;
  annexes: Annex[] = [];
  planCompleted = false;
  isLoading = false;
  isSaving = false;
  isMoving = false;

  // Formulario
  title = '';
  source = '';
  file: File | null = null;
  preview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private conversationService: ConversationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.idConversation = Number(this.route.snapshot.params['id']);
    this.obtenerAnexos();
  }

  obtenerAnexos(): void {
    this.isLoading = this.annexes.length === 0;

    this.conversationService.getAnnexes(this.idConversation).subscribe({
      next: (resp: any) => {
        this.annexes = resp.data?.annexes ?? [];
        this.planCompleted = !!resp.data?.plan_completed;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  get esExcel(): boolean {
    return !!this.file && /\.(xls|xlsx)$/i.test(this.file.name);
  }

  onFileSelected(event: any): void {
    const file: File | undefined = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const esImagen = /\.(jpe?g|png|webp)$/i.test(file.name);
    const esExcel = /\.(xls|xlsx)$/i.test(file.name);

    if (!esImagen && !esExcel) {
      this.mostrarMensaje('Solo se permiten imágenes (JPG, PNG o WEBP) o archivos Excel.');
      return;
    }

    if (file.size > this.MAX_MB * 1024 * 1024) {
      this.mostrarMensaje(`El archivo supera el tamaño máximo de ${this.MAX_MB} MB.`);
      return;
    }

    this.file = file;
    this.preview = null;

    if (esImagen) {
      const reader = new FileReader();
      reader.onload = () => this.preview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  quitarArchivo(): void {
    this.file = null;
    this.preview = null;
  }

  guardar(): void {
    if (!this.title.trim() || !this.file || this.isSaving) return;

    const data = new FormData();
    data.append('idConversation', String(this.idConversation));
    data.append('title', this.title.trim());
    if (this.source.trim()) {
      data.append('source', this.source.trim());
    }
    data.append('file', this.file, this.file.name);

    this.isSaving = true;

    this.conversationService.addAnnex(data).subscribe({
      next: () => {
        this.isSaving = false;
        this.title = '';
        this.source = '';
        this.quitarArchivo();
        this.obtenerAnexos();
      },
      error: (err: any) => {
        console.error(err);
        this.isSaving = false;
        this.mostrarMensaje(err?.error?.message ?? 'No se pudo agregar el anexo. Inténtalo de nuevo.');
      }
    });
  }

  // Sube o baja el anexo una posición
  mover(annex: Annex, direction: 'up' | 'down'): void {
    if (this.isMoving) return;

    this.isMoving = true;

    this.conversationService.moveAnnex(annex.id, direction).subscribe({
      next: () => {
        this.isMoving = false;
        this.obtenerAnexos();
      },
      error: (err: any) => {
        console.error(err);
        this.isMoving = false;
        this.mostrarMensaje('No se pudo mover el anexo. Inténtalo de nuevo.');
      }
    });
  }

  eliminar(annex: Annex): void {
    this.dialog
      .open(this.deleteDialog, { width: '420px', data: annex })
      .afterClosed()
      .subscribe((confirmado: boolean) => {
        if (!confirmado) return;

        this.conversationService.deleteAnnex(annex.id).subscribe({
          next: () => this.obtenerAnexos(),
          error: (err: any) => {
            console.error(err);
            this.mostrarMensaje('No se pudo eliminar el anexo. Inténtalo de nuevo.');
          }
        });
      });
  }

  volverADesarrollo(): void {
    this.router.navigate(['/conversations/edit', this.idConversation]);
  }

  private mostrarMensaje(message: string): void {
    this.dialog.open(DialogComponent, {
      width: '400px',
      data: { type: 'info', title: 'Información', message }
    });
  }
}

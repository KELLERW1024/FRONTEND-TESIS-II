import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-node-dialog',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],

  templateUrl: './edit-node-dialog.component.html',
  styleUrl: './edit-node-dialog.component.scss'
})
export class EditNodeDialogComponent {

  titulo: string = '';
  objective: string = '';

  constructor(
    private dialogRef: MatDialogRef<EditNodeDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {

    this.titulo = data.node.titulo ?? '';
    this.objective = data.node.objective ?? '';
  }

  cancelar(): void {

    this.dialogRef.close();
  }

  guardar(): void {

    if (!this.titulo.trim()) {
      return;
    }

    this.dialogRef.close({

      titulo: this.titulo.trim(),

      objective: this.objective.trim()
        ? this.objective.trim()
        : null

    });
  }
}

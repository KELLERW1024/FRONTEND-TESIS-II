import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delete-node-dialog',
  standalone: true,

  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],

  templateUrl: './delete-node-dialog.component.html',
  styleUrl: './delete-node-dialog.component.scss'
})
export class DeleteNodeDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<DeleteNodeDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}

  cancelar(): void {

    this.dialogRef.close(false);
  }

  eliminar(): void {

    this.dialogRef.close(true);
  }
}

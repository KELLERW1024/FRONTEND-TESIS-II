import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-move-node-dialog',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule, 
    MatIconModule
  ],

  templateUrl: './move-node-dialog.component.html',
  styleUrl: './move-node-dialog.component.scss',
})
export class MoveNodeDialogComponent {

  orden!: number;

  constructor(
    private dialogRef: MatDialogRef<MoveNodeDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {

    this.orden = data.currentOrder;
  }

  get positions(): number[] {

    return Array.from(
      {
        length: this.data.siblings.length
      },
      (_, index) => index + 1
    );

  }

  cancelar(): void {

    this.dialogRef.close();

  }

  mover(): void {

    this.dialogRef.close({
      orden: this.orden
    });

  }

}

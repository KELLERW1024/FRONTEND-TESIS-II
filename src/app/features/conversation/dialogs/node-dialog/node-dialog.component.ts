import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-node-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './node-dialog.component.html',
  styleUrl: './node-dialog.component.scss'
})
export class NodeDialogComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,

    private dialogRef: MatDialogRef<NodeDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {

    this.form = this.fb.group({

      titulo: [
        '',
        [
          Validators.required,
          Validators.maxLength(200)
        ]
      ],

      objective: [
        ''
      ]

    });

  }

  cancelar(): void {

    this.dialogRef.close();

  }

  guardar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.dialogRef.close(
      this.form.value
    );

  }

}

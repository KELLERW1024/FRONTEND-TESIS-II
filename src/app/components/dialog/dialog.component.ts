import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AppDialogData } from './AppDialogData';

@Component({
  selector: 'app-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {

  constructor(
    private dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppDialogData
  ) {}

  close() {
    this.dialogRef.close(true);
  }

  get icon() {
    switch (this.data.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
    }
  }

  get colorClass() {
    switch (this.data.type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
    }
  }

}

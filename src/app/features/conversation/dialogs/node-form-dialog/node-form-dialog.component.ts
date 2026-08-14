import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-node-form-dialog',
  imports: [],
  templateUrl: './node-form-dialog.component.html',
  styleUrl: './node-form-dialog.component.scss',
})
export interface NodeFormDialogData {
    mode: 'create' | 'edit';

    node?: PlanNode;

    parentId?: number | null;

    planId: number;

    userPlanId?: number | null;

    orden?: number;
}
export class NodeFormDialogComponent {

    form: FormGroup;

    constructor(
        private fb: FormBuilder,

        private dialogRef: MatDialogRef<NodeFormDialogComponent>,

        @Inject(MAT_DIALOG_DATA)
        public data: NodeFormDialogData
    ) {

        this.form = this.fb.group({
            titulo: [
                data.node?.titulo ?? '',
                [
                    Validators.required,
                    Validators.maxLength(200)
                ]
            ],

            objective: [
                data.node?.objective ?? ''
            ]
        });
    }
    get isEdit(): boolean {
        return this.data.mode === 'edit';
    }

    get title(): string {
        if (this.isEdit) {
            return 'Editar elemento';
        }

        if (this.data.parentId) {
            return 'Agregar hijo';
        }

        return 'Agregar elemento';
    }

    save(): void {

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.dialogRef.close({
            titulo: this.form.value.titulo,
            objective: this.form.value.objective
        });
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
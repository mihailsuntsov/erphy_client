import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplatesDialogComponent } from './templates-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [TemplatesDialogComponent],
  imports: [
    CommonModule,
    DragDropModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    TemplatesDialogComponent,
  ],
})
export class TemplatesDialogModule { }

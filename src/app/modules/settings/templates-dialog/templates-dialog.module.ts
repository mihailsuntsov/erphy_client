import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplatesDialogComponent } from './templates-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [TemplatesDialogComponent],
  imports: [
    CommonModule,
    DragDropModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    TemplatesDialogComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']}],
})
export class TemplatesDialogModule { }

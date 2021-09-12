import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsWriteoffDialogComponent } from './settings-writeoff-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsWriteoffDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsWriteoffDialogComponent,
  ],
})
export class SettingsWriteoffDialogModule { }

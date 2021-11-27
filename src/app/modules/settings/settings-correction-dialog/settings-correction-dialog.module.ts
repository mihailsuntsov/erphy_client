import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsCorrectionDialogComponent } from './settings-correction-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsCorrectionDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsCorrectionDialogComponent,
  ],
})
export class SettingsCorrectionDialogModule { }

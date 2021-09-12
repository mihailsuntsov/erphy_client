import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsPostingDialogComponent } from './settings-posting-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsPostingDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsPostingDialogComponent,
  ],
})
export class SettingsPostingDialogModule { }

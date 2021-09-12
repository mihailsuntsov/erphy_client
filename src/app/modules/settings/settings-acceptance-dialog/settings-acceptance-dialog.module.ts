import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsAcceptanceDialogComponent } from './settings-acceptance-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsAcceptanceDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsAcceptanceDialogComponent,
  ],
})
export class SettingsAcceptanceDialogModule { }

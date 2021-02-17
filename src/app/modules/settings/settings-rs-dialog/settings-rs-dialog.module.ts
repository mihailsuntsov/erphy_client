import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRetailsalesDialogComponent } from './settings-rs-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsRetailsalesDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsRetailsalesDialogComponent,
  ],
})
export class SettingsRsDialogModule { }

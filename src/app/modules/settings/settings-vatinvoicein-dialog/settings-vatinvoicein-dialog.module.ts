import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsVatinvoiceinDialogComponent } from './settings-vatinvoicein-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsVatinvoiceinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsVatinvoiceinDialogComponent,
  ],
})
export class SettingsVatinvoiceinDialogModule { }

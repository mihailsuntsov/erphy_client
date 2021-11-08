import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsVatinvoiceoutDialogComponent } from './settings-vatinvoiceout-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsVatinvoiceoutDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsVatinvoiceoutDialogComponent,
  ],
})
export class SettingsVatinvoiceoutDialogModule { }

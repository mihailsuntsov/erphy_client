import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsInvoiceoutDialogComponent } from './settings-invoiceout-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsInvoiceoutDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsInvoiceoutDialogComponent,
  ],
})
export class SettingsInvoiceoutDialogModule { }

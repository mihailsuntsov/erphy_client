import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsInvoiceinDialogComponent } from './settings-invoicein-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsInvoiceinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsInvoiceinDialogComponent,
  ],
})
export class SettingsInvoiceinDialogModule { }

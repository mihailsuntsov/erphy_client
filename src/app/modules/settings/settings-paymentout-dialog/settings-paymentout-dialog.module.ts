import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsPaymentoutDialogComponent } from './settings-paymentout-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsPaymentoutDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsPaymentoutDialogComponent,
  ],
})
export class SettingsPaymentoutDialogModule { }

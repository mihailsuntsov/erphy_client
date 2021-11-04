import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsPaymentinDialogComponent } from './settings-paymentin-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsPaymentinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsPaymentinDialogComponent,
  ],
})
export class SettingsPaymentinDialogModule { }

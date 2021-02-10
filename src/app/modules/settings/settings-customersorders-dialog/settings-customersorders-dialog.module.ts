import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsCustomersordersDialogComponent } from './settings-customersorders-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsCustomersordersDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsCustomersordersDialogComponent,
  ]
})
export class SettingsCustomersordersDialogModule { }

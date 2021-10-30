import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsOrdersupDialogComponent } from './settings-ordersup-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsOrdersupDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsOrdersupDialogComponent,
  ],
})
export class SettingsOrdersupDialogModule { }

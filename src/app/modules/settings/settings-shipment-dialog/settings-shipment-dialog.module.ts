import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsShipmentDialogComponent } from './settings-shipment-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsShipmentDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsShipmentDialogComponent,
  ],
})
export class SettingsShipmentDialogModule { }

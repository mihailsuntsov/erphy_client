import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsInventoryDialogComponent } from './settings-inventory-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsInventoryDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsInventoryDialogComponent,
  ],
})
export class SettingsInventoryDialogModule { }

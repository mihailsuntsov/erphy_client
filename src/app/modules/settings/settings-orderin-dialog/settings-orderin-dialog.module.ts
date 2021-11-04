import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsOrderinDialogComponent } from './settings-orderin-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsOrderinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsOrderinDialogComponent,
  ],
})
export class SettingsOrderinDialogModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsMovingDialogComponent } from './settings-moving-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [SettingsMovingDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsMovingDialogComponent,
  ],
})
export class SettingsMovingDialogModule { }

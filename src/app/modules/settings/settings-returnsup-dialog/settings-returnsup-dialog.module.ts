import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsReturnsupDialogComponent } from './settings-returnsup-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [SettingsReturnsupDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsReturnsupDialogComponent,
  ],
})
export class SettingsReturnsupDialogModule { }

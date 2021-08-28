import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsReturnDialogComponent } from './settings-return-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [SettingsReturnDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsReturnDialogComponent,
  ],
})
export class SettingsReturnDialogModule { }

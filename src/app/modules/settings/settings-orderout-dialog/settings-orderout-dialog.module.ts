import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsOrderoutDialogComponent } from './settings-orderout-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsOrderoutDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    SettingsOrderoutDialogComponent,
  ],
})
export class SettingsOrderoutDialogModule { }

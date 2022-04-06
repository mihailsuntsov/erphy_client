import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsReturnsupDialogComponent } from './settings-returnsup-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [SettingsReturnsupDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsReturnsupDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsReturnsupDialogModule { }

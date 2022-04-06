import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsPaymentinDialogComponent } from './settings-paymentin-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SettingsPaymentinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsPaymentinDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsPaymentinDialogModule { }

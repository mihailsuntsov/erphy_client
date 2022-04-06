import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsInvoiceinDialogComponent } from './settings-invoicein-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SettingsInvoiceinDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsInvoiceinDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsInvoiceinDialogModule { }

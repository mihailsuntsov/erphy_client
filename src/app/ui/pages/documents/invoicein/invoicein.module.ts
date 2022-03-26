import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceinRoutingModule } from './invoicein-routing.module';
import { InvoiceinComponent } from './invoicein.component';

import { SettingsInvoiceinDialogModule } from '../../../../modules/settings/settings-invoicein-dialog/settings-invoicein-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [InvoiceinComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    InvoiceinRoutingModule,
    SettingsInvoiceinDialogModule,
    
    FormsModule,
    TranslocoModule,
    MaterialModule
  ]
})
export class InvoiceinModule { }

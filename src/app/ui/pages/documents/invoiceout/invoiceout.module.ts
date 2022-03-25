import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceoutRoutingModule } from './invoiceout-routing.module';
import { InvoiceoutComponent } from './invoiceout.component';

import { SettingsInvoiceoutDialogModule } from '../../../../modules/settings/settings-invoiceout-dialog/settings-invoiceout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [InvoiceoutComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    InvoiceoutRoutingModule,
    SettingsInvoiceoutDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class InvoiceoutModule { }

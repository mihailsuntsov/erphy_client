import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceoutRoutingModule } from './invoiceout-routing.module';
import { InvoiceoutComponent } from './invoiceout.component';

import { SettingsInvoiceoutDialogModule } from '../../../../modules/settings/settings-invoiceout-dialog/settings-invoiceout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [InvoiceoutComponent],
  imports: [
    CommonModule,
    InvoiceoutRoutingModule,
    SettingsInvoiceoutDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class InvoiceoutModule { }

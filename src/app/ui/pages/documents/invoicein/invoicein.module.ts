import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceinRoutingModule } from './invoicein-routing.module';
import { InvoiceinComponent } from './invoicein.component';

import { SettingsInvoiceinDialogModule } from '../../../../modules/settings/settings-invoicein-dialog/settings-invoicein-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [InvoiceinComponent],
  imports: [
    CommonModule,
    InvoiceinRoutingModule,
    SettingsInvoiceinDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class InvoiceinModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceinDocRoutingModule } from './invoicein-doc-routing.module';
import { InvoiceinDocComponent } from './invoicein-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsInvoiceinDialogModule } from '../../../../modules/settings/settings-invoicein-dialog/settings-invoicein-dialog.module';
import { InvoiceinProductsTableModule } from 'src/app/modules/trade-modules/invoicein-products-table/invoicein-products-table.module';

@NgModule({
  declarations: [InvoiceinDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    InvoiceinDocRoutingModule,
    SettingsInvoiceinDialogModule,
    InvoiceinProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class InvoiceinDocModule { }

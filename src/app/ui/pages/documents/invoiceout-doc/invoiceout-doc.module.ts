import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceoutDocRoutingModule } from './invoiceout-doc-routing.module';
import { InvoiceoutDocComponent } from './invoiceout-doc.component';
import { ValidationService } from './validation.service';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsInvoiceoutDialogModule } from '../../../../modules/settings/settings-invoiceout-dialog/settings-invoiceout-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
// import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [InvoiceoutDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    InvoiceoutDocRoutingModule,
    SettingsInvoiceoutDialogModule,
    TemplatesDialogModule,
    ProductSearchAndTableModule,
    // KkmModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class InvoiceoutDocModule { }

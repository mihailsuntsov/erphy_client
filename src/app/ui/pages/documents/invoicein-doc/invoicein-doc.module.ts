import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceinDocRoutingModule } from './invoicein-doc-routing.module';
import { InvoiceinDocComponent } from './invoicein-doc.component';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsInvoiceinDialogModule } from '../../../../modules/settings/settings-invoicein-dialog/settings-invoicein-dialog.module';
import { InvoiceinProductsTableModule } from 'src/app/modules/trade-modules/invoicein-products-table/invoicein-products-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [InvoiceinDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    InvoiceinDocRoutingModule,
    TemplatesDialogModule,
    SettingsInvoiceinDialogModule,
    InvoiceinProductsTableModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class InvoiceinDocModule { }

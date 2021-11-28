import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetailsalesDocRoutingModule } from './retailsales-doc-routing.module';
import { RetailsalesDocComponent } from './retailsales-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRsDialogModule } from '../../../../modules/settings/settings-retailsales-dialog/settings-rs-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [RetailsalesDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    RetailsalesDocRoutingModule,
    SettingsRsDialogModule,
    ProductSearchAndTableModule,
    KkmModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class RetailsalesDocModule { }

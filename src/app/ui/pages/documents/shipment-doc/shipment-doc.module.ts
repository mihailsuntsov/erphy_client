import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentDocRoutingModule } from './shipment-doc-routing.module';
import { ShipmentDocComponent } from './shipment-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsShipmentDialogModule } from '../../../../modules/settings/settings-shipment-dialog/settings-shipment-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [ShipmentDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    ShipmentDocRoutingModule,
    SettingsShipmentDialogModule,
    ProductSearchAndTableModule,
    BalanceCagentModule,
    KkmModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class ShipmentDocModule { }

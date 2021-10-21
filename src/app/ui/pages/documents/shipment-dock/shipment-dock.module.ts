import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentDockRoutingModule } from './shipment-dock-routing.module';
import { ShipmentDockComponent } from './shipment-dock.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsShipmentDialogModule } from '../../../../modules/settings/settings-shipment-dialog/settings-shipment-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [ShipmentDockComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    ShipmentDockRoutingModule,
    SettingsShipmentDialogModule,
    ProductSearchAndTableModule,
    KkmModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class ShipmentDockModule { }

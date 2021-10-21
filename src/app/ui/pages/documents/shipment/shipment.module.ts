import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShipmentRoutingModule } from './shipment-routing.module';
import { ShipmentComponent } from './shipment.component';

import { SettingsShipmentDialogModule } from '../../../../modules/settings/settings-shipment-dialog/settings-shipment-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [ShipmentComponent],
  imports: [
    CommonModule,
    ShipmentRoutingModule,
    SettingsShipmentDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class ShipmentModule { }

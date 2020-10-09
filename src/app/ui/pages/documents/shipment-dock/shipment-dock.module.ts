import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShipmentDockRoutingModule } from './shipment-dock-routing.module';
import { ShipmentDockComponent } from './shipment-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ShipmentDockComponent],
  imports: [
    CommonModule,
    ShipmentDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ShipmentDockModule { }

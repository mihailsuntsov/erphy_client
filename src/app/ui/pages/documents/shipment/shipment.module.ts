import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShipmentRoutingModule } from './shipment-routing.module';
import { ShipmentComponent } from './shipment.component';

import { SettingsShipmentDialogModule } from '../../../../modules/settings/settings-shipment-dialog/settings-shipment-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ShipmentComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ShipmentRoutingModule,
    SettingsShipmentDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class ShipmentModule { }

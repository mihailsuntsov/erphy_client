import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipmentDocRoutingModule } from './shipment-doc-routing.module';
import { ShipmentDocComponent } from './shipment-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { SettingsShipmentDialogModule } from '../../../../modules/settings/settings-shipment-dialog/settings-shipment-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [ShipmentDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    ShipmentDocRoutingModule,
    TemplatesDialogModule,
    SettingsShipmentDialogModule,
    ProductSearchAndTableModule,
    BalanceCagentModule,
    KkmModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class ShipmentDocModule { }

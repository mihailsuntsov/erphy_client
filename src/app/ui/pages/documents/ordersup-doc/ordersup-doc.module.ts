import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersupDocRoutingModule } from './ordersup-doc-routing.module';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { OrdersupDocComponent } from './ordersup-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsOrdersupDialogModule } from '../../../../modules/settings/settings-ordersup-dialog/settings-ordersup-dialog.module';
import { OrdersupProductsTableModule } from 'src/app/modules/trade-modules/ordersup-products-table/ordersup-products-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [OrdersupDocComponent, /*ControlMessagesComponent*/],
  providers: [ValidationService,
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']}
  ],
  imports: [
    CommonModule,
    OrdersupDocRoutingModule,
    SettingsOrdersupDialogModule,
    OrdersupProductsTableModule,
    TemplatesDialogModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
})
export class OrdersupDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersupDocRoutingModule } from './ordersup-doc-routing.module';
import { OrdersupDocComponent } from './ordersup-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsOrdersupDialogModule } from '../../../../modules/settings/settings-ordersup-dialog/settings-ordersup-dialog.module';
import { OrdersupProductsTableModule } from 'src/app/modules/trade-modules/ordersup-products-table/ordersup-products-table.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [OrdersupDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    OrdersupDocRoutingModule,
    SettingsOrdersupDialogModule,
    OrdersupProductsTableModule,
    KkmModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class OrdersupDocModule { }

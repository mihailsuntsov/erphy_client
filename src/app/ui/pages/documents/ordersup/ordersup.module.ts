import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersupRoutingModule } from './ordersup-routing.module';
import { OrdersupComponent } from './ordersup.component';

import { SettingsOrdersupDialogModule } from '../../../../modules/settings/settings-ordersup-dialog/settings-ordersup-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [OrdersupComponent],
  imports: [
    CommonModule,
    OrdersupRoutingModule,
    SettingsOrdersupDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class OrdersupModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersupRoutingModule } from './ordersup-routing.module';
import { OrdersupComponent } from './ordersup.component';

import { SettingsOrdersupDialogModule } from '../../../../modules/settings/settings-ordersup-dialog/settings-ordersup-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [OrdersupComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    OrdersupRoutingModule,
    SettingsOrdersupDialogModule,
    
    FormsModule,
    TranslocoModule,
    MaterialModule
  ]
})
export class OrdersupModule { }

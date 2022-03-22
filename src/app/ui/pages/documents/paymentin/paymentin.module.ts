import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentinRoutingModule } from './paymentin-routing.module';
import { PaymentinComponent } from './paymentin.component';

import { SettingsPaymentinDialogModule } from '../../../../modules/settings/settings-paymentin-dialog/settings-paymentin-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentinComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    PaymentinRoutingModule,
    SettingsPaymentinDialogModule,
    
    FormsModule,
    TranslocoModule,
    MaterialModule
  ]
})
export class PaymentinModule { }

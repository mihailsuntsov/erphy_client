import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentoutRoutingModule } from './paymentout-routing.module';
import { PaymentoutComponent } from './paymentout.component';

import { SettingsPaymentoutDialogModule } from '../../../../modules/settings/settings-paymentout-dialog/settings-paymentout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentoutComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    PaymentoutRoutingModule,
    SettingsPaymentoutDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class PaymentoutModule { }

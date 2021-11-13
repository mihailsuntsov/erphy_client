import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PaymentoutRoutingModule } from './paymentout-routing.module';
import { PaymentoutComponent } from './paymentout.component';

import { SettingsPaymentoutDialogModule } from '../../../../modules/settings/settings-paymentout-dialog/settings-paymentout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [PaymentoutComponent],
  imports: [
    CommonModule,
    PaymentoutRoutingModule,
    SettingsPaymentoutDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class PaymentoutModule { }

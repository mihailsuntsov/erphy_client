import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentinDocRoutingModule } from './paymentin-doc-routing.module';
import { PaymentinDocComponent } from './paymentin-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsPaymentinDialogModule } from '../../../../modules/settings/settings-paymentin-dialog/settings-paymentin-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';

@NgModule({
  declarations: [PaymentinDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    PaymentinDocRoutingModule,
    SettingsPaymentinDialogModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class PaymentinDocModule { }

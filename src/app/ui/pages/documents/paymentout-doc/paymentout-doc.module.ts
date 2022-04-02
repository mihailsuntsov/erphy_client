import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentoutDocRoutingModule } from './paymentout-doc-routing.module';
import { PaymentoutDocComponent } from './paymentout-doc.component';
import { ValidationService } from './validation.service';
import { BalanceAccountModule } from 'src/app/modules/info-modules/balance/balance-account/balance-account.module';
import { BalanceBoxofficeModule } from 'src/app/modules/info-modules/balance/balance-boxoffice/balance-boxoffice.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsPaymentoutDialogModule } from '../../../../modules/settings/settings-paymentout-dialog/settings-paymentout-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentoutDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    PaymentoutDocRoutingModule,
    SettingsPaymentoutDialogModule,
    BalanceCagentModule,
    BalanceAccountModule,
    BalanceBoxofficeModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class PaymentoutDocModule { }

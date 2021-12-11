import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WithdrawalDocRoutingModule } from './withdrawal-doc-routing.module';
import { WithdrawalDocComponent } from './withdrawal-doc.component';
import { ValidationService } from './validation.service';
import { ControlMessagesComponent } from './control-messages.component';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BalanceKassaModule } from 'src/app/modules/info-modules/balance/balance-kassa/balance-kassa.module';

@NgModule({
  declarations: [WithdrawalDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    WithdrawalDocRoutingModule,
    BalanceKassaModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class WithdrawalDocModule { }

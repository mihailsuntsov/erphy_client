import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepositingDocRoutingModule } from './depositing-doc-routing.module';
import { DepositingDocComponent } from './depositing-doc.component';
import { ValidationService } from './validation.service';
import { ControlMessagesComponent } from './control-messages.component';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BalanceKassaModule } from 'src/app/modules/info-modules/balance/balance-kassa/balance-kassa.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [DepositingDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    DepositingDocRoutingModule,
    BalanceKassaModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class DepositingDocModule { }

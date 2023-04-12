import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceBoxofficeComponent } from './balance-boxoffice.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { MoneyflowDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [BalanceBoxofficeComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule,
    MoneyflowDetModule
  ],
  exports: [BalanceBoxofficeComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceBoxofficeModule { }

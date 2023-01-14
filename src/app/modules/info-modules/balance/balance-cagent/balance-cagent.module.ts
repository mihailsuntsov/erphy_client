import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceCagentComponent } from './balance-cagent.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { MutualpaymentDetModule } from 'src/app/modules/info-modules/mutualpayment_det/mutualpayment_det.module';
@NgModule({
  declarations: [BalanceCagentComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule,
    MutualpaymentDetModule
  ],
  exports: [BalanceCagentComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceCagentModule { }

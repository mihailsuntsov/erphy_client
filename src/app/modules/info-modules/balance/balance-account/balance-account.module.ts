import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceAccountComponent } from './balance-account.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BalanceAccountComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule
  ],
  exports: [BalanceAccountComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceAccountModule { }

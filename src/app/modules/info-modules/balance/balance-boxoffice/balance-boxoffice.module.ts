import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceBoxofficeComponent } from './balance-boxoffice.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BalanceBoxofficeComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule
  ],
  exports: [BalanceBoxofficeComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceBoxofficeModule { }

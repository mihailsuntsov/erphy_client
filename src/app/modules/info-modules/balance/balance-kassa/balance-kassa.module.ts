import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceKassaComponent } from './balance-kassa.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BalanceKassaComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule
  ],
  exports: [BalanceKassaComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceKassaModule { }

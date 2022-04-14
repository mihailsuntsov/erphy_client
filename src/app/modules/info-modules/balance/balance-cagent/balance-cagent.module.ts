import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceCagentComponent } from './balance-cagent.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BalanceCagentComponent],
  imports: [
    CommonModule,
    MaterialModule,
    TranslocoModule
  ],
  exports: [BalanceCagentComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class BalanceCagentModule { }

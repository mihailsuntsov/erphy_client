import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WithdrawalRoutingModule } from './withdrawal-routing.module';
import { WithdrawalComponent } from './withdrawal.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [WithdrawalComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    WithdrawalRoutingModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class WithdrawalModule { }

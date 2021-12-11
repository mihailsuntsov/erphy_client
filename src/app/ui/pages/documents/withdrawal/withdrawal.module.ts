import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WithdrawalRoutingModule } from './withdrawal-routing.module';
import { WithdrawalComponent } from './withdrawal.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [WithdrawalComponent],
  imports: [
    CommonModule,
    WithdrawalRoutingModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class WithdrawalModule { }

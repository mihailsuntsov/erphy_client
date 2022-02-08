import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceAccountComponent } from './balance-account.component';

@NgModule({
  declarations: [BalanceAccountComponent],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [BalanceAccountComponent],
})
export class BalanceAccountModule { }

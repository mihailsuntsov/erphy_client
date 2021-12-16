import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceBoxofficeComponent } from './balance-boxoffice.component';

@NgModule({
  declarations: [BalanceBoxofficeComponent],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [BalanceBoxofficeComponent],
})
export class BalanceBoxofficeModule { }

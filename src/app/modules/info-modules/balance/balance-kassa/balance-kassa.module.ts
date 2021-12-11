import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceKassaComponent } from './balance-kassa.component';

@NgModule({
  declarations: [BalanceKassaComponent],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [BalanceKassaComponent],
})
export class BalanceKassaModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { BalanceCagentComponent } from './balance-cagent.component';

@NgModule({
  declarations: [BalanceCagentComponent],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [BalanceCagentComponent],
})
export class BalanceCagentModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MoneyflowDetRoutingModule } from './moneyflow_det-routing.module';
import { MoneyflowDetComponent } from './moneyflow_det.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [MoneyflowDetComponent],
  imports: [
    CommonModule,
    MoneyflowDetRoutingModule,
    ReactiveFormsModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class MoneyflowDetModule { }

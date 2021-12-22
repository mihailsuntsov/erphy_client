import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MoneyflowRoutingModule } from './moneyflow-routing.module';
import { MoneyflowComponent } from './moneyflow.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

import { MoneyflowDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [MoneyflowComponent],
  imports: [
    CommonModule,
    MoneyflowRoutingModule,
    ReactiveFormsModule,
    MoneyflowDetModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class MoneyflowModule { }

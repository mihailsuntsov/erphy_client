import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MoneyflowRoutingModule } from './moneyflow-routing.module';
import { MoneyflowComponent } from './moneyflow.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

import { MoneyflowDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [MoneyflowComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    MoneyflowRoutingModule,
    ReactiveFormsModule,
    MoneyflowDetModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class MoneyflowModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MutualpaymentRoutingModule } from './mutualpayment-routing.module';
import { MutualpaymentComponent } from './mutualpayment.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

import { MutualpaymentDetModule } from 'src/app/modules/info-modules/mutualpayment_det/mutualpayment_det.module';

@NgModule({
  declarations: [MutualpaymentComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    MutualpaymentRoutingModule,
    ReactiveFormsModule,
    MutualpaymentDetModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class MutualpaymentModule { }

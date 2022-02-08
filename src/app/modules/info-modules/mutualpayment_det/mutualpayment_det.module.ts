import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MutualpaymentDetRoutingModule } from './mutualpayment_det-routing.module';
import { MutualpaymentDetComponent } from './mutualpayment_det.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [MutualpaymentDetComponent],
  imports: [
    CommonModule,
    MutualpaymentDetRoutingModule,
    ReactiveFormsModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class MutualpaymentDetModule { }
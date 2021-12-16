import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepositingRoutingModule } from './depositing-routing.module';
import { DepositingComponent } from './depositing.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [DepositingComponent],
  imports: [
    CommonModule,
    DepositingRoutingModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class DepositingModule { }

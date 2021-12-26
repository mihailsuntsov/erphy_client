import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfitlossRoutingModule } from './profitloss-routing.module';
import { ProfitlossComponent } from './profitloss.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

// import { ProfitlossDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [ProfitlossComponent],
  imports: [
    CommonModule,
    ProfitlossRoutingModule,
    ReactiveFormsModule,
    // ProfitlossDetModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class ProfitlossModule { }

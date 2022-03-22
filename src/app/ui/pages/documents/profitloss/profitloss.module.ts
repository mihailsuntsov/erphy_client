import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfitlossRoutingModule } from './profitloss-routing.module';
import { ProfitlossComponent } from './profitloss.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

// import { ProfitlossDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [ProfitlossComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ProfitlossRoutingModule,
    ReactiveFormsModule,
    // ProfitlossDetModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class ProfitlossModule { }

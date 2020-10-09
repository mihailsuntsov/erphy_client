import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraderesultsRoutingModule } from './traderesults-routing.module';
import { TraderesultsComponent } from './traderesults.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [TraderesultsComponent],
  imports: [
    CommonModule,
    TraderesultsRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class TraderesultsModule { }

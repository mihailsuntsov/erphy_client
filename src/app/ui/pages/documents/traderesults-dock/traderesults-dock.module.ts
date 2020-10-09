import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraderesultsDockRoutingModule } from './traderesults-dock-routing.module';
import { TraderesultsDockComponent } from './traderesults-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [TraderesultsDockComponent],
  imports: [
    CommonModule,
    TraderesultsDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class TraderesultsDockModule { }

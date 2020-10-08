import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraderesultsReportRoutingModule } from './traderesults-report-routing.module';
import { TraderesultsReportComponent } from './traderesults-report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [TraderesultsReportComponent],
  imports: [
    CommonModule,
    TraderesultsReportRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ]
})
export class TraderesultsReportModule { }

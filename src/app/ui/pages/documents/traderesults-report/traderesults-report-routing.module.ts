import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TraderesultsReportComponent } from './traderesults-report.component';

const routes: Routes = [{ path: '', component: TraderesultsReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraderesultsReportRoutingModule { }

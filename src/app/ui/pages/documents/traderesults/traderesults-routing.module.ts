import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TraderesultsComponent } from './traderesults.component';

const routes: Routes = [{ path: '', component: TraderesultsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraderesultsRoutingModule { }

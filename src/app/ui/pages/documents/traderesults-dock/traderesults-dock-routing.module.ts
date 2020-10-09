import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TraderesultsDockComponent } from './traderesults-dock.component';

const routes: Routes = [
  { path: '', component: TraderesultsDockComponent },
  { path: ':id', component: TraderesultsDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraderesultsDockRoutingModule { }

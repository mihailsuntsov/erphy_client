import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TraderesultsDocComponent } from './traderesults-doc.component';

const routes: Routes = [
  { path: '', component: TraderesultsDocComponent },
  { path: ':id', component: TraderesultsDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraderesultsDocRoutingModule { }

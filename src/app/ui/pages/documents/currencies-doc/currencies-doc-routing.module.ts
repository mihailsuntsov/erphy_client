import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CurrenciesDocComponent } from './currencies-doc.component';

const routes: Routes = [
  { path: '', component: CurrenciesDocComponent },
  { path: ':id', component: CurrenciesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CurrenciesDocRoutingModule { }

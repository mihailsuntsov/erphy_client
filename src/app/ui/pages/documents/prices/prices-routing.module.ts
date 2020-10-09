import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PricesComponent } from './prices.component';

const routes: Routes = [{ path: '', component: PricesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PricesRoutingModule { }

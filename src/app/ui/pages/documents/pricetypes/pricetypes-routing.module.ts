import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PricetypesComponent } from './pricetypes.component';

const routes: Routes = [{ path: '', component: PricetypesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PricetypesRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PricetypesDocComponent } from './pricetypes-doc.component';

const routes: Routes = [
  { path: '', component: PricetypesDocComponent },
  { path: ':id', component: PricetypesDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PricetypesDocRoutingModule { }

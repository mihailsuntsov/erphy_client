import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PricetypesDockComponent } from './pricetypes-dock.component';

const routes: Routes = [
  { path: '', component: PricetypesDockComponent },
  { path: ':id', component: PricetypesDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PricetypesDockRoutingModule { }

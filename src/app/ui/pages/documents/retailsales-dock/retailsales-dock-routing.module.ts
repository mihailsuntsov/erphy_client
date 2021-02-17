import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RetailsalesDockComponent } from './retailsales-dock.component';

const routes: Routes = [
  { path: '', component: RetailsalesDockComponent },
  { path: ':id', component: RetailsalesDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RetailsalesDockRoutingModule { }

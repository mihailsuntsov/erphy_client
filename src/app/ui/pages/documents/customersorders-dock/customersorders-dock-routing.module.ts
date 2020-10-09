import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomersordersDockComponent } from './customersorders-dock.component';

const routes: Routes = [
  { path: '', component: CustomersordersDockComponent },
  { path: ':id', component: CustomersordersDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersordersDockRoutingModule { }

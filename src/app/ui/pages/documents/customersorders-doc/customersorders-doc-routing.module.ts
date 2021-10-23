import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomersordersDocComponent } from './customersorders-doc.component';

const routes: Routes = [
  { path: '', component: CustomersordersDocComponent },
  { path: ':id', component: CustomersordersDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersordersDocRoutingModule { }

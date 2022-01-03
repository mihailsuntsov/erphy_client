import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomersordersComponent } from './customersorders.component';

const routes: Routes = [{ path: '', component: CustomersordersComponent },
{ path: ':option', component: CustomersordersComponent },];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersordersRoutingModule { }

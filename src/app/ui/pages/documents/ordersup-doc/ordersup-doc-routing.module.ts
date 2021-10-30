import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrdersupDocComponent } from './ordersup-doc.component';

const routes: Routes = [
  { path: '', component: OrdersupDocComponent },
  { path: ':id', component: OrdersupDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersupDocRoutingModule { }

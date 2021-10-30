import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdersupComponent } from './ordersup.component';

const routes: Routes = [{ path: '', component: OrdersupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersupRoutingModule { }

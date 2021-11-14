import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderoutDocComponent } from './orderout-doc.component';

const routes: Routes = [
  { path: '', component: OrderoutDocComponent },
  { path: ':id', component: OrderoutDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderoutDocRoutingModule { }

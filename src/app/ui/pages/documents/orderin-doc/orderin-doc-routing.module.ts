import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderinDocComponent } from './orderin-doc.component';

const routes: Routes = [
  { path: '', component: OrderinDocComponent },
  { path: ':id', component: OrderinDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderinDocRoutingModule { }

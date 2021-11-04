import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentinDocComponent } from './paymentin-doc.component';

const routes: Routes = [
  { path: '', component: PaymentinDocComponent },
  { path: ':id', component: PaymentinDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentinDocRoutingModule { }

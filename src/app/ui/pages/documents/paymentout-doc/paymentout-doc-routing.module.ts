import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PaymentoutDocComponent } from './paymentout-doc.component';

const routes: Routes = [
  { path: '', component: PaymentoutDocComponent },
  { path: ':id', component: PaymentoutDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentoutDocRoutingModule { }

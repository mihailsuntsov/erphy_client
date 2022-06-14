import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PaymentAccountDocComponent } from './accounts-doc.component';

const routes: Routes = [
  { path: '', component: PaymentAccountDocComponent },
  { path: ':id', component: PaymentAccountDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentAccountDocRoutingModule { }

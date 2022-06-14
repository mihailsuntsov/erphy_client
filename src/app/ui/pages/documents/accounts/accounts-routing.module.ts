import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PaymentAccountComponent } from './accounts.component';

const routes: Routes = [{ path: '', component: PaymentAccountComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentAccountRoutingModule { }

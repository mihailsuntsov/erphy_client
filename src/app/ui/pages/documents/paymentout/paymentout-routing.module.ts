import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentoutComponent } from './paymentout.component';

const routes: Routes = [{ path: '', component: PaymentoutComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentoutRoutingModule { }

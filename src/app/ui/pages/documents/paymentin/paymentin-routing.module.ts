import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentinComponent } from './paymentin.component';

const routes: Routes = [{ path: '', component: PaymentinComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentinRoutingModule { }

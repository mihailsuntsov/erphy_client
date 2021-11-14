import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderoutComponent } from './orderout.component';

const routes: Routes = [{ path: '', component: OrderoutComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderoutRoutingModule { }

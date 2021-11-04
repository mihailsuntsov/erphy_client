import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderinComponent } from './orderin.component';

const routes: Routes = [{ path: '', component: OrderinComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderinRoutingModule { }

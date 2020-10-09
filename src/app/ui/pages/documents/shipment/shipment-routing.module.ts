import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShipmentComponent } from './shipment.component';

const routes: Routes = [{ path: '', component: ShipmentComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShipmentRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShipmentDockComponent } from './shipment-dock.component';

const routes: Routes = [
  { path: '', component: ShipmentDockComponent },
  { path: ':id', component: ShipmentDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShipmentDockRoutingModule { }

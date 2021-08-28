import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryDockComponent } from './inventory-dock.component';

const routes: Routes = [
  { path: '', component: InventoryDockComponent },
  { path: ':id', component: InventoryDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryDockRoutingModule { }

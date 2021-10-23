import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryDocComponent } from './inventory-doc.component';

const routes: Routes = [
  { path: '', component: InventoryDocComponent },
  { path: ':id', component: InventoryDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryDocRoutingModule { }

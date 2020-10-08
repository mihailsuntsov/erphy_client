import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductsDockComponent } from './products-dock.component';

const routes: Routes = [
  { path: '', component: ProductsDockComponent },
  { path: ':id', component: ProductsDockComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsDockRoutingModule { }

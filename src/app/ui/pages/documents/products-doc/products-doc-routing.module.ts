import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductsDocComponent } from './products-doc.component';

const routes: Routes = [
  { path: '', component: ProductsDocComponent },
  { path: ':id', component: ProductsDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsDocRoutingModule { }

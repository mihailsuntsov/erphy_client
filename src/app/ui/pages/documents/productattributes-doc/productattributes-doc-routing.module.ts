import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductAttributeDocComponent } from './productattributes-doc.component';

const routes: Routes = [
  { path: '', component: ProductAttributeDocComponent },
  { path: ':id', component: ProductAttributeDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductAttributeDocRoutingModule { }

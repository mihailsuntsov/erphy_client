import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductAttributeComponent } from './productattributes.component';

const routes: Routes = [{ path: '', component: ProductAttributeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductAttributeRoutingModule { }

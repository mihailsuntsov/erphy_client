import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductgroupsDocComponent } from './productgroups-doc.component';

const routes: Routes = [
  { path: '', component: ProductgroupsDocComponent },
  { path: ':id', component: ProductgroupsDocComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductgroupsDocRoutingModule { }

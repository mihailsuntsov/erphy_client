import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductgroupsComponent } from './productgroups.component';

const routes: Routes = [{ path: '', component: ProductgroupsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductgroupsRoutingModule { }

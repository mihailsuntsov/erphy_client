import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductgroupsDockComponent } from './productgroups-dock.component';

const routes: Routes = [{ path: '', component: ProductgroupsDockComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductgroupsDockRoutingModule { }

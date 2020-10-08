import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductgroupsRoutingModule } from './productgroups-routing.module';
import { ProductgroupsComponent } from './productgroups.component';


@NgModule({
  declarations: [ProductgroupsComponent],
  imports: [
    CommonModule,
    ProductgroupsRoutingModule
  ]
})
export class ProductgroupsModule { }

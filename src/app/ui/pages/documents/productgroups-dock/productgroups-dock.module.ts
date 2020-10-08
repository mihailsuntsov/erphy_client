import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductgroupsDockRoutingModule } from './productgroups-dock-routing.module';
import { ProductgroupsDockComponent } from './productgroups-dock.component';


@NgModule({
  declarations: [ProductgroupsDockComponent],
  imports: [
    CommonModule,
    ProductgroupsDockRoutingModule
  ]
})
export class ProductgroupsDockModule { }

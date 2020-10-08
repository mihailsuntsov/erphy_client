import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductgroupsRoutingModule } from './productgroups-routing.module';
import { ProductgroupsComponent } from './productgroups.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';


@NgModule({
  declarations: [ProductgroupsComponent],
  imports: [
    CommonModule,
    ProductgroupsRoutingModule,
    
    MaterialModule,
    FormsModule
  ]
})
export class ProductgroupsModule { }

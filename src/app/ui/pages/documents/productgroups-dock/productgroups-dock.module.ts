import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductgroupsDockRoutingModule } from './productgroups-dock-routing.module';
import { ProductgroupsDockComponent } from './productgroups-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductgroupsDockComponent],
  imports: [
    CommonModule,
    ProductgroupsDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class ProductgroupsDockModule { }

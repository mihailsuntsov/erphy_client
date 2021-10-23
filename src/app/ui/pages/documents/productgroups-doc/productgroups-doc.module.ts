import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductgroupsDocRoutingModule } from './productgroups-doc-routing.module';
import { ProductgroupsDocComponent } from './productgroups-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductgroupsDocComponent],
  imports: [
    CommonModule,
    ProductgroupsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class ProductgroupsDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductsComponent],
  imports: [
    CommonModule,
    ProductsRoutingModule,

    MaterialModule,
    FormsModule,
    DragDropModule
  ]
})
export class ProductsModule { }

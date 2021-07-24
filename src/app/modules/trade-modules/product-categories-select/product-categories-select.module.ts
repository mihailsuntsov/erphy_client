import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCategoriesSelectComponent } from './product-categories-select.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, } from '@angular/forms';

@NgModule({
  declarations: [ProductCategoriesSelectComponent],
  imports: [
    CommonModule,
    
    DragDropModule,
    MaterialModule,
    FormsModule,
  ],
  exports: [ProductCategoriesSelectComponent],
})
export class ProductCategoriesSelectModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsDocRoutingModule } from './products-doc-routing.module';
import { ProductsDocComponent } from './products-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule/*, FormArray, FormControl, FormGroup, FormBuilder */} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductsDocComponent],
  imports: [
    CommonModule,
    ProductsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule, 
    // FormArray, FormControl, FormGroup, FormBuilder 
  ]
})
export class ProductsDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsDockRoutingModule } from './products-dock-routing.module';
import { ProductsDockComponent } from './products-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule/*, FormArray, FormControl, FormGroup, FormBuilder */} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductsDockComponent],
  imports: [
    CommonModule,
    ProductsDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule, 
    // FormArray, FormControl, FormGroup, FormBuilder 
  ]
})
export class ProductsDockModule { }

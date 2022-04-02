import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsDocRoutingModule } from './products-doc-routing.module';
import { ProductsDocComponent } from './products-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule/*, FormArray, FormControl, FormGroup, FormBuilder */} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ProductsDocComponent],
  imports: [
    CommonModule,
    ProductsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
    // FormArray, FormControl, FormGroup, FormBuilder 
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductsDocModule { }

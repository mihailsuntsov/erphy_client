import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsDocRoutingModule } from './products-doc-routing.module';
import { ProductsDocComponent } from './products-doc.component';
// import { HttpClientModule} from '@angular/common/http';
// import { AngularEditorModule } from '@kolkov/angular-editor';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule/*, FormArray, FormControl, FormGroup, FormBuilder */} from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { QuillModule } from 'ngx-quill'

@NgModule({
  declarations: [ProductsDocComponent],
  imports: [
    CommonModule,
    ProductsDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule,
    // HttpClientModule,
    // AngularEditorModule
    QuillModule.forRoot(),
    ProductCategoriesSelectModule,
    // FormArray, FormControl, FormGroup, FormBuilder 
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductsDocModule { }

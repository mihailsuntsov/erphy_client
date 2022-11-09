import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAttributeDocRoutingModule } from './productattributes-doc-routing.module';
import { ProductAttributeDocComponent } from './productattributes-doc.component';
import { ProductAttributeTermsModule } from 'src/app/modules/trade-modules/product-attribute-terms/product-attribute-terms.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ProductAttributeDocComponent],
  imports: [
    CommonModule,
    ProductAttributeDocRoutingModule,
    ProductAttributeTermsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductAttributeDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAttributeDocRoutingModule } from './productattributes-doc-routing.module';
import { ProductAttributeDocComponent } from './productattributes-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ProductAttributeDocComponent],
  imports: [
    CommonModule,
    ProductAttributeDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductAttributeDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAttributeTermsComponent } from './product-attribute-terms.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ProductAttributeTermsComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    TranslocoModule, 
    ReactiveFormsModule
  ],
  exports: [ProductAttributeTermsComponent],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class ProductAttributeTermsModule { }

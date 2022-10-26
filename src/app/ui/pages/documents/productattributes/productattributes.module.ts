import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductAttributeRoutingModule } from './productattributes-routing.module';
import { ProductAttributeComponent } from './productattributes.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ProductAttributeComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ProductAttributeRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class ProductAttributeModule { }

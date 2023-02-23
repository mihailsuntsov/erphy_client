import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { StoresSelectModule } from 'src/app/modules/trade-modules/stores-select/stores-select.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
// import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { LabelsPrintDialogModule } from '../../../../modules/settings/labelprint-dialog/labelprint-dialog.module';

@NgModule({
  declarations: [ProductsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    ProductCategoriesSelectModule,
    StoresSelectModule,
    // TemplatesDialogModule,
    LabelsPrintDialogModule,
    MaterialModule,
    FormsModule,
    DragDropModule,
    TranslocoModule
  ]
})
export class ProductsModule { }

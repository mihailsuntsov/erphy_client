import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MovingProductsTableComponent } from './moving-products-table.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';

@NgModule({
  declarations: [MovingProductsTableComponent, ControlMessagesComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ProductCategoriesSelectModule,
    ReactiveFormsModule
  ],
  exports: [MovingProductsTableComponent],
  providers: [ValidationService],
})
export class MovingProductsTableModule { }
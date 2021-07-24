import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesOnPeriodComponent } from './sales-on-period.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [SalesOnPeriodComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ProductCategoriesSelectModule,
    NgxChartsModule,
  ],
  exports: [SalesOnPeriodComponent],
})
export class SalesOnPeriodModule { }

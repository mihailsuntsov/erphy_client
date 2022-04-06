import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesOnPeriodComponent } from './sales-on-period.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SalesOnPeriodComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ProductCategoriesSelectModule,
    NgxChartsModule,
    TranslocoModule
  ],
  exports: [SalesOnPeriodComponent],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SalesOnPeriodModule { }

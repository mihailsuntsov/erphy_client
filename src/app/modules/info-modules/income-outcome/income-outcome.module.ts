import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeOutcomeComponent } from './income-outcome.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ComboChartComponent, ComboSeriesVerticalComponent } from './combo-chart';

@NgModule({
  declarations: [IncomeOutcomeComponent,
    ComboChartComponent, ComboSeriesVerticalComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxChartsModule,
  ],
  exports: [IncomeOutcomeComponent],
})
export class IncomeOutcomeModule { }

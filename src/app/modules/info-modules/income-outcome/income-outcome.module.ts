import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeOutcomeComponent } from './income-outcome.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ComboChartComponent, ComboSeriesVerticalComponent } from './combo-chart';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [IncomeOutcomeComponent,
    ComboChartComponent, ComboSeriesVerticalComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxChartsModule,
    TranslocoModule
  ],
  exports: [IncomeOutcomeComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['modules']},
  ],
})
export class IncomeOutcomeModule { }

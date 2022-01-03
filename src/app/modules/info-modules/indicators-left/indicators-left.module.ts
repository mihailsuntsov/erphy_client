import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicatorsLeftComponent } from './indicators-left.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [IndicatorsLeftComponent,],
  imports: [
    CommonModule,
    MaterialModule,
    NgxChartsModule,
  ],
  exports: [IndicatorsLeftComponent],
})
export class IndicatorsLeftModule { }

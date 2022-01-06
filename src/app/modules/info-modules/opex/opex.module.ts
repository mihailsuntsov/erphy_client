import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpexComponent } from './opex.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [OpexComponent,
    ],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxChartsModule,
  ],
  exports: [OpexComponent],
})
export class OpexModule { }

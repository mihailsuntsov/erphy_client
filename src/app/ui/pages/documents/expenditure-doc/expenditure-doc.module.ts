import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenditureDocRoutingModule } from './expenditure-doc-routing.module';
import { ExpenditureDocComponent } from './expenditure-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ExpenditureDocComponent],
  imports: [
    CommonModule,
    ExpenditureDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class ExpenditureDocModule { }

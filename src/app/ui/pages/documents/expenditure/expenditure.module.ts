import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenditureRoutingModule } from './expenditure-routing.module';
import { ExpenditureComponent } from './expenditure.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [ExpenditureComponent],
  imports: [
    CommonModule,
    ExpenditureRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class ExpenditureModule { }

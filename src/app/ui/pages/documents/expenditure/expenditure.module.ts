import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenditureRoutingModule } from './expenditure-routing.module';
import { ExpenditureComponent } from './expenditure.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ExpenditureComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ExpenditureRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class ExpenditureModule { }

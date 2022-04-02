import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenditureDocRoutingModule } from './expenditure-doc-routing.module';
import { ExpenditureDocComponent } from './expenditure-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ExpenditureDocComponent],
  imports: [
    CommonModule,
    ExpenditureDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ExpenditureDocModule { }

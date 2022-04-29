import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrenciesDocRoutingModule } from './currencies-doc-routing.module';
import { CurrenciesDocComponent } from './currencies-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CurrenciesDocComponent],
  imports: [
    CommonModule,
    CurrenciesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class CurrenciesDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraderesultsDocRoutingModule } from './traderesults-doc-routing.module';
import { TraderesultsDocComponent } from './traderesults-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [TraderesultsDocComponent],
  imports: [
    CommonModule,
    TraderesultsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class TraderesultsDocModule { }

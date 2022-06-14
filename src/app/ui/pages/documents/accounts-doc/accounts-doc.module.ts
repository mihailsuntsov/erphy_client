import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentAccountDocRoutingModule } from './accounts-doc-routing.module';
import { PaymentAccountDocComponent } from './accounts-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentAccountDocComponent],
  imports: [
    CommonModule,
    PaymentAccountDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class PaymentAccountDocModule { }

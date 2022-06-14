import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentAccountRoutingModule } from './accounts-routing.module';
import { PaymentAccountComponent } from './accounts.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PaymentAccountComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    PaymentAccountRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class PaymentAccountModule { }

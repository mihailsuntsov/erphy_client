import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriptionRoutingModule } from './subscription-routing.module';
import { SubscriptionComponent } from './subscription.component';
import { UserLegalInfoModule } from '../../../../modules/user-legal-info/user-legal-info.module';
import { PaymentSelectModule } from '../../../../modules/payment-select/payment-select.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SubscriptionComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    SubscriptionRoutingModule,
    ReactiveFormsModule,
    UserLegalInfoModule,
    PaymentSelectModule,
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class SubscriptionModule { }

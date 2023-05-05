import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriptionRoutingModule } from './subscription-routing.module';
import { SubscriptionComponent } from './subscription.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

// import { SubscriptionDetModule } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.module';

@NgModule({
  declarations: [SubscriptionComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    SubscriptionRoutingModule,
    ReactiveFormsModule,
    // SubscriptionDetModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class SubscriptionModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepositingRoutingModule } from './depositing-routing.module';
import { DepositingComponent } from './depositing.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [DepositingComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    DepositingRoutingModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class DepositingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricesRoutingModule } from './prices-routing.module';
import { PricesComponent } from './prices.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PricesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    PricesRoutingModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule, 
    TranslocoModule,
  ]
})
export class PricesModule { }

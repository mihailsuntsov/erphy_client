import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrenciesRoutingModule } from './currencies-routing.module';
import { CurrenciesComponent } from './currencies.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CurrenciesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    CurrenciesRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class CurrenciesModule { }

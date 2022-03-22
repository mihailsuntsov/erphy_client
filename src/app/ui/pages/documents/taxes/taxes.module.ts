import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxesRoutingModule } from './taxes-routing.module';
import { TaxesComponent } from './taxes.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [TaxesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    TaxesRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class TaxesModule { }
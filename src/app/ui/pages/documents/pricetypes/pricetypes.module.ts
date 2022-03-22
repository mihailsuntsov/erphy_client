import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricetypesRoutingModule } from './pricetypes-routing.module';
import { PricetypesComponent } from './pricetypes.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [PricetypesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    PricetypesRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class PricetypesModule { }

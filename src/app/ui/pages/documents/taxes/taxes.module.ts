import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxesRoutingModule } from './taxes-routing.module';
import { TaxesComponent } from './taxes.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [TaxesComponent],
  imports: [
    CommonModule,
    TaxesRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class TaxesModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricetypesRoutingModule } from './pricetypes-routing.module';
import { PricetypesComponent } from './pricetypes.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [PricetypesComponent],
  imports: [
    CommonModule,
    PricetypesRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class PricetypesModule { }

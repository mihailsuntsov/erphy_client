import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricesRoutingModule } from './prices-routing.module';
import { PricesComponent } from './prices.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [PricesComponent],
  imports: [
    CommonModule,
    PricesRoutingModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PricesModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersordersRoutingModule } from './customersorders-routing.module';
import { CustomersordersComponent } from './customersorders.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [CustomersordersComponent],
  imports: [
    CommonModule,
    CustomersordersRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class CustomersordersModule { }

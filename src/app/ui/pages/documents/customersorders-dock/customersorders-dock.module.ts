import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersordersDockRoutingModule } from './customersorders-dock-routing.module';
import { CustomersordersDockComponent } from './customersorders-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [CustomersordersDockComponent],
  imports: [
    CommonModule,
    CustomersordersDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CustomersordersDockModule { }

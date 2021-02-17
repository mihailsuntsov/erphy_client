import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RetailsalesDockRoutingModule } from './retailsales-dock-routing.module';
import { RetailsalesDockComponent } from './retailsales-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [RetailsalesDockComponent],
  imports: [
    CommonModule,
    RetailsalesDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class RetailsalesDockModule { }

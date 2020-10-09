import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptanceRoutingModule } from './acceptance-routing.module';
import { AcceptanceComponent } from './acceptance.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';


@NgModule({
  declarations: [AcceptanceComponent],
  imports: [
    CommonModule,
    AcceptanceRoutingModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class AcceptanceModule { }

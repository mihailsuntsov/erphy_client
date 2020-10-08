import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PricetypesDockRoutingModule } from './pricetypes-dock-routing.module';
import { PricetypesDockComponent } from './pricetypes-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PricetypesDockComponent],
  imports: [
    CommonModule,
    PricetypesDockRoutingModule,
    MaterialModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PricetypesDockModule { }

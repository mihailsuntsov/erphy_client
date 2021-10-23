import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricetypesDocRoutingModule } from './pricetypes-doc-routing.module';
import { PricetypesDocComponent } from './pricetypes-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PricetypesDocComponent],
  imports: [
    CommonModule,
    PricetypesDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PricetypesDocModule { }

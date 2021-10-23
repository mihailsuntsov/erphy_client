import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KassaDocRoutingModule } from './kassa-doc-routing.module';
import { KassaDocComponent } from './kassa-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [KassaDocComponent],
  imports: [
    CommonModule,
    KassaDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class KassaDocModule { }

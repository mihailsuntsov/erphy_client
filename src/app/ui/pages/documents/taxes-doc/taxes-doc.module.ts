import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxesDocRoutingModule } from './taxes-doc-routing.module';
import { TaxesDocComponent } from './taxes-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [TaxesDocComponent],
  imports: [
    CommonModule,
    TaxesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class TaxesDocModule { }

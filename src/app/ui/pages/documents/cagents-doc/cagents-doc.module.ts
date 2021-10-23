import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CagentsDocRoutingModule } from './cagents-doc-routing.module';
import { CagentsDocComponent } from './cagents-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [CagentsDocComponent],
  imports: [
    CommonModule,
    CagentsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class CagentsDocModule { }

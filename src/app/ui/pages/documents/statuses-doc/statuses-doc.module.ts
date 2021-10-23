import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusesDocRoutingModule } from './statuses-doc-routing.module';
import { StatusesDocComponent } from './statuses-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [StatusesDocComponent],
  imports: [
    CommonModule,
    StatusesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class StatusesDocModule { }

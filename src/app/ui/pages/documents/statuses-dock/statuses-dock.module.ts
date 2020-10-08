import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusesDockRoutingModule } from './statuses-dock-routing.module';
import { StatusesDockComponent } from './statuses-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [StatusesDockComponent],
  imports: [
    CommonModule,
    StatusesDockRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class StatusesDockModule { }

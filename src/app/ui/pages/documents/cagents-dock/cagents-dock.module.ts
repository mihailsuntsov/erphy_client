import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CagentsDockRoutingModule } from './cagents-dock-routing.module';
import { CagentsDockComponent } from './cagents-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [CagentsDockComponent],
  imports: [
    CommonModule,
    CagentsDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule
  ]
})
export class CagentsDockModule { }

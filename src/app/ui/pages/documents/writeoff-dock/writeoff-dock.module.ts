import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WriteoffDockRoutingModule } from './writeoff-dock-routing.module';
import { WriteoffDockComponent } from './writeoff-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [WriteoffDockComponent],
  imports: [
    CommonModule,
    WriteoffDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class WriteoffDockModule { }

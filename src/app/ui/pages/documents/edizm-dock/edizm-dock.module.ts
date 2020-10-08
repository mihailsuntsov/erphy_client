import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdizmDockRoutingModule } from './edizm-dock-routing.module';
import { EdizmDockComponent } from './edizm-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [EdizmDockComponent],
  imports: [
    CommonModule,
    EdizmDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EdizmDockModule { }

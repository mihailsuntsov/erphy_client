import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepartmentsDockRoutingModule } from './departments-dock-routing.module';
import { DepartmentsDockComponent } from './departments-dock.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [DepartmentsDockComponent],
  imports: [
    CommonModule,
    DepartmentsDockRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule
  ]
})
export class DepartmentsDockModule { }

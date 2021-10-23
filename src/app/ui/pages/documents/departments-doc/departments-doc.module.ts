import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepartmentsDocRoutingModule } from './departments-doc-routing.module';
import { DepartmentsDocComponent } from './departments-doc.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [DepartmentsDocComponent],
  imports: [
    CommonModule,
    DepartmentsDocRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule
  ]
})
export class DepartmentsDocModule { }

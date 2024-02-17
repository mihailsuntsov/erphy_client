import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentsDocRoutingModule } from './departments-doc-routing.module';
import { DepartmentsDocComponent } from './departments-doc.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { DepartmentPartsModule } from 'src/app/modules/trade-modules/department-parts/department-parts.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [DepartmentsDocComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},
  ],
  imports: [
    CommonModule,
    DepartmentsDocRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DepartmentPartsModule,
    MaterialModule,
    DragDropModule,
    TranslocoModule
  ]
})
export class DepartmentsDocModule { }

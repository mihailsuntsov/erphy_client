import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentPartsComponent } from './department-parts.component';
import { MaterialModule } from 'src/app/modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DepartmentPartsComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    TranslocoModule, 
    ReactiveFormsModule
  ],
  exports: [DepartmentPartsComponent],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class DepartmentPartsModule { }

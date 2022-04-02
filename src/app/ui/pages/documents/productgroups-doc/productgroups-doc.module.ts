import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductgroupsDocRoutingModule } from './productgroups-doc-routing.module';
import { ProductgroupsDocComponent } from './productgroups-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ProductgroupsDocComponent],
  imports: [
    CommonModule,
    ProductgroupsDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ProductgroupsDocModule { }

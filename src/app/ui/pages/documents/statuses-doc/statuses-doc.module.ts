import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusesDocRoutingModule } from './statuses-doc-routing.module';
import { StatusesDocComponent } from './statuses-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [StatusesDocComponent],
  imports: [
    CommonModule,
    StatusesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class StatusesDocModule { }

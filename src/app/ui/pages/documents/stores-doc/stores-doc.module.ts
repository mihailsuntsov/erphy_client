import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoresDocRoutingModule } from './stores-doc-routing.module';
import { StoresDocComponent } from './stores-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [StoresDocComponent],
  imports: [
    CommonModule,
    StoresDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class StoresDocModule { }

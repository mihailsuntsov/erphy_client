import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxesDocRoutingModule } from './taxes-doc-routing.module';
import { TaxesDocComponent } from './taxes-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [TaxesDocComponent],
  imports: [
    CommonModule,
    TaxesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class TaxesDocModule { }

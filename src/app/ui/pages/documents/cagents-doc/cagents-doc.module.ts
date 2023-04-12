import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CagentsDocRoutingModule } from './cagents-doc-routing.module';
import { CagentsDocComponent } from './cagents-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { MutualpaymentDetModule } from 'src/app/modules/info-modules/mutualpayment_det/mutualpayment_det.module';

@NgModule({
  declarations: [CagentsDocComponent],
  imports: [
    CommonModule,
    CagentsDocRoutingModule,
    MutualpaymentDetModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class CagentsDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoxofficeDocRoutingModule } from './boxoffice-doc-routing.module';
import { BoxofficeDocComponent } from './boxoffice-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BoxofficeDocComponent],
  imports: [
    CommonModule,
    BoxofficeDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class BoxofficeDocModule { }

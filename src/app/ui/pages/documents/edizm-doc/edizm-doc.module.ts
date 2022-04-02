import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdizmDocRoutingModule } from './edizm-doc-routing.module';
import { EdizmDocComponent } from './edizm-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [EdizmDocComponent],
  imports: [
    CommonModule,
    EdizmDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class EdizmDocModule { }

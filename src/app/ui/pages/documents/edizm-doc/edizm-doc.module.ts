import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdizmDocRoutingModule } from './edizm-doc-routing.module';
import { EdizmDocComponent } from './edizm-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [EdizmDocComponent],
  imports: [
    CommonModule,
    EdizmDocRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EdizmDocModule { }

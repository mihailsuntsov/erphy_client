import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdizmRoutingModule } from './edizm-routing.module';
import { EdizmComponent } from './edizm.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [EdizmComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    EdizmRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class EdizmModule { }

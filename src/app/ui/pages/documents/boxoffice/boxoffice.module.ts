import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoxofficeRoutingModule } from './boxoffice-routing.module';
import { BoxofficeComponent } from './boxoffice.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [BoxofficeComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    BoxofficeRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class BoxofficeModule { }

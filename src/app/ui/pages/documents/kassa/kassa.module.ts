import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KassaRoutingModule } from './kassa-routing.module';
import { KassaComponent } from './kassa.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [KassaComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    KassaRoutingModule,

    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class KassaModule { }

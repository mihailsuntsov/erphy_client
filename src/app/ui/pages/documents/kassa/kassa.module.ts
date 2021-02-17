import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KassaRoutingModule } from './kassa-routing.module';
import { KassaComponent } from './kassa.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [KassaComponent],
  imports: [
    CommonModule,
    KassaRoutingModule,

    MaterialModule,
    FormsModule,
  ]
})
export class KassaModule { }

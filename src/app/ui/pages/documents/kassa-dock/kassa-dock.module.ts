import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KassaDockRoutingModule } from './kassa-dock-routing.module';
import { KassaDockComponent } from './kassa-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [KassaDockComponent],
  imports: [
    CommonModule,
    KassaDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class KassaDockModule { }

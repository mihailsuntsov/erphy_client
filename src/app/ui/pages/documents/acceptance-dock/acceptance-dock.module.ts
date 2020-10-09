import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptanceDockRoutingModule } from './acceptance-dock-routing.module';
import { AcceptanceDockComponent } from './acceptance-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AcceptanceDockComponent],
  imports: [
    CommonModule,
    AcceptanceDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AcceptanceDockModule { }

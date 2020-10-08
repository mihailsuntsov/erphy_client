import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusesRoutingModule } from './statuses-routing.module';
import { StatusesComponent } from './statuses.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [StatusesComponent],
  imports: [
    CommonModule,
    StatusesRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class StatusesModule { }

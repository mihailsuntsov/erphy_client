import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatusesRoutingModule } from './statuses-routing.module';
import { StatusesComponent } from './statuses.component';


@NgModule({
  declarations: [StatusesComponent],
  imports: [
    CommonModule,
    StatusesRoutingModule
  ]
})
export class StatusesModule { }

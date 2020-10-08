import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatusesDockRoutingModule } from './statuses-dock-routing.module';
import { StatusesDockComponent } from './statuses-dock.component';


@NgModule({
  declarations: [StatusesDockComponent],
  imports: [
    CommonModule,
    StatusesDockRoutingModule
  ]
})
export class StatusesDockModule { }

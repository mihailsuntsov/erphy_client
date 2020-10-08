import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EdizmRoutingModule } from './edizm-routing.module';
import { EdizmComponent } from './edizm.component';


@NgModule({
  declarations: [EdizmComponent],
  imports: [
    CommonModule,
    EdizmRoutingModule
  ]
})
export class EdizmModule { }

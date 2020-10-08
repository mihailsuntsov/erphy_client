import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdizmRoutingModule } from './edizm-routing.module';
import { EdizmComponent } from './edizm.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [EdizmComponent],
  imports: [
    CommonModule,
    EdizmRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class EdizmModule { }

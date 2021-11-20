import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoxofficeRoutingModule } from './boxoffice-routing.module';
import { BoxofficeComponent } from './boxoffice.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [BoxofficeComponent],
  imports: [
    CommonModule,
    BoxofficeRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class BoxofficeModule { }

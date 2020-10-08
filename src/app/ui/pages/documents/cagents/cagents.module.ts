import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CagentsRoutingModule } from './cagents-routing.module';
import { CagentsComponent } from './cagents.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [CagentsComponent],
  imports: [
    CommonModule,
    CagentsRoutingModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class CagentsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingRoutingModule } from './posting-routing.module';
import { PostingComponent } from './posting.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [PostingComponent],
  imports: [
    CommonModule,
    PostingRoutingModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class PostingModule { }

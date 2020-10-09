import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingDockRoutingModule } from './posting-dock-routing.module';
import { PostingDockComponent } from './posting-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PostingDockComponent],
  imports: [
    CommonModule,
    PostingDockRoutingModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PostingDockModule { }

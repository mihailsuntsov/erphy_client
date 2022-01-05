import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemainsRoutingModule } from './remains-routing.module';
import { RemainsComponent } from './remains.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material.module';

@NgModule({
  declarations: [RemainsComponent],
  imports: [
    CommonModule,
    RemainsRoutingModule,
    
    MaterialModule,
    FormsModule, 
    ReactiveFormsModule
  ],
  exports: [RemainsComponent],
})
export class RemainsModule { }

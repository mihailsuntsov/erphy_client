import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemainsRoutingModule } from './remains-routing.module';
import { RemainsComponent } from './remains.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [RemainsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    RemainsRoutingModule,
    
    MaterialModule,
    FormsModule, 
    TranslocoModule,
    ReactiveFormsModule
  ] 
})
export class RemainsModule { }

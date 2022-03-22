import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusesRoutingModule } from './statuses-routing.module';
import { StatusesComponent } from './statuses.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [StatusesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    StatusesRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class StatusesModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductgroupsRoutingModule } from './productgroups-routing.module';
import { ProductgroupsComponent } from './productgroups.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [ProductgroupsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ProductgroupsRoutingModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class ProductgroupsModule { }

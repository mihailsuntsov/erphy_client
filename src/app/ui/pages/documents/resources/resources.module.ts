import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesRoutingModule } from './resources-routing.module';
import { ResourcesComponent } from './resources.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ResourcesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ResourcesRoutingModule,    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class ResourcesModule { }

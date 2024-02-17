import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesDocRoutingModule } from './resources-doc-routing.module';
import { ResourcesDocComponent } from './resources-doc.component';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ControlMessagesComponent } from './control-messages.component';

@NgModule({
  declarations: [ResourcesDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    ResourcesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class ResourcesDocModule { }

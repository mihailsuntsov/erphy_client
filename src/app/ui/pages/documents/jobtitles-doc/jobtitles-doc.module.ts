import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobtitlesDocRoutingModule } from './jobtitles-doc-routing.module';
import { JobtitlesDocComponent } from './jobtitles-doc.component';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ControlMessagesComponent } from './control-messages.component';
import { ProductCategoriesSelectModule } from 'src/app/modules/trade-modules/product-categories-select/product-categories-select.module';

@NgModule({
  declarations: [JobtitlesDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    JobtitlesDocRoutingModule,
    MaterialModule,
    ProductCategoriesSelectModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class JobtitlesDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingDocRoutingModule } from './posting-doc-routing.module';
import { PostingDocComponent } from './posting-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsPostingDialogModule } from '../../../../modules/settings/settings-posting-dialog/settings-posting-dialog.module';
import { PostingProductsTableModule } from 'src/app/modules/trade-modules/posting-products-table/posting-products-table.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [PostingDocComponent],
  imports: [
    CommonModule,
    PostingDocRoutingModule,
    SettingsPostingDialogModule,
    PostingProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class PostingDocModule { }

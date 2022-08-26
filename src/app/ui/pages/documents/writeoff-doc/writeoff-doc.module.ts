import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WriteoffDocRoutingModule } from './writeoff-doc-routing.module';
import { WriteoffDocComponent } from './writeoff-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsWriteoffDialogModule } from '../../../../modules/settings/settings-writeoff-dialog/settings-writeoff-dialog.module';
import { WriteoffProductsTableModule } from 'src/app/modules/trade-modules/writeoff-products-table/writeoff-products-table.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [WriteoffDocComponent],
  imports: [
    CommonModule,
    WriteoffDocRoutingModule,
    SettingsWriteoffDialogModule,
    WriteoffProductsTableModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},]
})
export class WriteoffDocModule { }

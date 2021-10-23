import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WriteoffDocRoutingModule } from './writeoff-doc-routing.module';
import { WriteoffDocComponent } from './writeoff-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsWriteoffDialogModule } from '../../../../modules/settings/settings-writeoff-dialog/settings-writeoff-dialog.module';
import { WriteoffProductsTableModule } from 'src/app/modules/trade-modules/writeoff-products-table/writeoff-products-table.module';

@NgModule({
  declarations: [WriteoffDocComponent],
  imports: [
    CommonModule,
    WriteoffDocRoutingModule,
    SettingsWriteoffDialogModule,
    WriteoffProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class WriteoffDocModule { }

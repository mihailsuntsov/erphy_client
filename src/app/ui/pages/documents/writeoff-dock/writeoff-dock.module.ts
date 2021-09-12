import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WriteoffDockRoutingModule } from './writeoff-dock-routing.module';
import { WriteoffDockComponent } from './writeoff-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsWriteoffDialogModule } from '../../../../modules/settings/settings-writeoff-dialog/settings-writeoff-dialog.module';
import { WriteoffProductsTableModule } from 'src/app/modules/trade-modules/writeoff-products-table/writeoff-products-table.module';

@NgModule({
  declarations: [WriteoffDockComponent],
  imports: [
    CommonModule,
    WriteoffDockRoutingModule,
    SettingsWriteoffDialogModule,
    WriteoffProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class WriteoffDockModule { }

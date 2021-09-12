import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingDockRoutingModule } from './posting-dock-routing.module';
import { PostingDockComponent } from './posting-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsPostingDialogModule } from '../../../../modules/settings/settings-posting-dialog/settings-posting-dialog.module';
import { PostingProductsTableModule } from 'src/app/modules/trade-modules/posting-products-table/posting-products-table.module';

@NgModule({
  declarations: [PostingDockComponent],
  imports: [
    CommonModule,
    PostingDockRoutingModule,
    SettingsPostingDialogModule,
    PostingProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PostingDockModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostingDocRoutingModule } from './posting-doc-routing.module';
import { PostingDocComponent } from './posting-doc.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsPostingDialogModule } from '../../../../modules/settings/settings-posting-dialog/settings-posting-dialog.module';
import { PostingProductsTableModule } from 'src/app/modules/trade-modules/posting-products-table/posting-products-table.module';

@NgModule({
  declarations: [PostingDocComponent],
  imports: [
    CommonModule,
    PostingDocRoutingModule,
    SettingsPostingDialogModule,
    PostingProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PostingDocModule { }

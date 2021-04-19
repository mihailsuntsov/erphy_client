import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetailsalesDockRoutingModule } from './retailsales-dock-routing.module';
import { RetailsalesDockComponent } from './retailsales-dock.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRsDialogModule } from '../../../../modules/settings/settings-retailsales-dialog/settings-rs-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [RetailsalesDockComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    RetailsalesDockRoutingModule,
    SettingsRsDialogModule,
    ProductSearchAndTableModule,
    KkmModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class RetailsalesDockModule { }

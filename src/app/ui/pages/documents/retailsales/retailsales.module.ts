import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetailsalesRoutingModule } from './retailsales-routing.module';
import { RetailsalesComponent } from './retailsales.component';
import { SettingsRsDialogModule } from '../../../../modules/settings/settings-retailsales-dialog/settings-rs-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [RetailsalesComponent],
  imports: [
    CommonModule,
    RetailsalesRoutingModule,
    SettingsRsDialogModule,

    MaterialModule,
    FormsModule,
  ]
})
export class RetailsalesModule { } 

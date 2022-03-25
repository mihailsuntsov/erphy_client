import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RetailsalesRoutingModule } from './retailsales-routing.module';
import { RetailsalesComponent } from './retailsales.component';

import { SettingsRsDialogModule } from '../../../../modules/settings/settings-retailsales-dialog/settings-rs-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [RetailsalesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    RetailsalesRoutingModule,
    SettingsRsDialogModule,

    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class RetailsalesModule { } 

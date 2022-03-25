import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VatinvoiceinRoutingModule } from './vatinvoicein-routing.module';
import { VatinvoiceinComponent } from './vatinvoicein.component';

import { SettingsVatinvoiceinDialogModule } from '../../../../modules/settings/settings-vatinvoicein-dialog/settings-vatinvoicein-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [VatinvoiceinComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    VatinvoiceinRoutingModule,
    SettingsVatinvoiceinDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class VatinvoiceinModule { }

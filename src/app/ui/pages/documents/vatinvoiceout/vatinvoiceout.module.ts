import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VatinvoiceoutRoutingModule } from './vatinvoiceout-routing.module';
import { VatinvoiceoutComponent } from './vatinvoiceout.component';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';

import { SettingsVatinvoiceoutDialogModule } from '../../../../modules/settings/settings-vatinvoiceout-dialog/settings-vatinvoiceout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [VatinvoiceoutComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    VatinvoiceoutRoutingModule,
    SettingsVatinvoiceoutDialogModule,
    TemplatesDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class VatinvoiceoutModule { }

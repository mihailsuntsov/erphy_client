import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VatinvoiceoutRoutingModule } from './vatinvoiceout-routing.module';
import { VatinvoiceoutComponent } from './vatinvoiceout.component';

import { SettingsVatinvoiceoutDialogModule } from '../../../../modules/settings/settings-vatinvoiceout-dialog/settings-vatinvoiceout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [VatinvoiceoutComponent],
  imports: [
    CommonModule,
    VatinvoiceoutRoutingModule,
    SettingsVatinvoiceoutDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class VatinvoiceoutModule { }

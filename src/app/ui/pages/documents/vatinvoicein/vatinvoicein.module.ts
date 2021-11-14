import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VatinvoiceinRoutingModule } from './vatinvoicein-routing.module';
import { VatinvoiceinComponent } from './vatinvoicein.component';

import { SettingsVatinvoiceinDialogModule } from '../../../../modules/settings/settings-vatinvoicein-dialog/settings-vatinvoicein-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [VatinvoiceinComponent],
  imports: [
    CommonModule,
    VatinvoiceinRoutingModule,
    SettingsVatinvoiceinDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class VatinvoiceinModule { }

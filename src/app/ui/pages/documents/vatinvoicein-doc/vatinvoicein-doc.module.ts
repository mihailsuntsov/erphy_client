import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VatinvoiceinDocRoutingModule } from './vatinvoicein-doc-routing.module';
import { VatinvoiceinDocComponent } from './vatinvoicein-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsVatinvoiceinDialogModule } from '../../../../modules/settings/settings-vatinvoicein-dialog/settings-vatinvoicein-dialog.module';

@NgModule({
  declarations: [VatinvoiceinDocComponent,],
  imports: [
    CommonModule,
    VatinvoiceinDocRoutingModule,
    SettingsVatinvoiceinDialogModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class VatinvoiceinDocModule { }
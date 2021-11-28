import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VatinvoiceoutDocRoutingModule } from './vatinvoiceout-doc-routing.module';
import { VatinvoiceoutDocComponent } from './vatinvoiceout-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsVatinvoiceoutDialogModule } from '../../../../modules/settings/settings-vatinvoiceout-dialog/settings-vatinvoiceout-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';

@NgModule({
  declarations: [VatinvoiceoutDocComponent,],
  imports: [
    CommonModule,
    VatinvoiceoutDocRoutingModule,
    SettingsVatinvoiceoutDialogModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class VatinvoiceoutDocModule { }

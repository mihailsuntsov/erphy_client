import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VatinvoiceoutDocRoutingModule } from './vatinvoiceout-doc-routing.module';
import { VatinvoiceoutDocComponent } from './vatinvoiceout-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsVatinvoiceoutDialogModule } from '../../../../modules/settings/settings-vatinvoiceout-dialog/settings-vatinvoiceout-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [VatinvoiceoutDocComponent,],
  imports: [
    CommonModule,
    VatinvoiceoutDocRoutingModule,
    TemplatesDialogModule,
    SettingsVatinvoiceoutDialogModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class VatinvoiceoutDocModule { }

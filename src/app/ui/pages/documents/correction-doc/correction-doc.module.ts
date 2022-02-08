import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrectionDocRoutingModule } from './correction-doc-routing.module';
import { CorrectionDocComponent } from './correction-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsCorrectionDialogModule } from '../../../../modules/settings/settings-correction-dialog/settings-correction-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
// import { BalanceKassaModule } from 'src/app/modules/info-modules/balance/balance-kassa/balance-kassa.module';
import { BalanceBoxofficeModule } from 'src/app/modules/info-modules/balance/balance-boxoffice/balance-boxoffice.module';
import { BalanceAccountModule } from 'src/app/modules/info-modules/balance/balance-account/balance-account.module';

@NgModule({
  declarations: [CorrectionDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    CorrectionDocRoutingModule,
    SettingsCorrectionDialogModule,
    BalanceCagentModule,
    BalanceBoxofficeModule,
    BalanceAccountModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class CorrectionDocModule { }

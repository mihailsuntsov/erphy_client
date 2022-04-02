import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderinDocRoutingModule } from './orderin-doc-routing.module';
import { OrderinDocComponent } from './orderin-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsOrderinDialogModule } from '../../../../modules/settings/settings-orderin-dialog/settings-orderin-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { BalanceKassaModule } from 'src/app/modules/info-modules/balance/balance-kassa/balance-kassa.module';
import { BalanceBoxofficeModule } from 'src/app/modules/info-modules/balance/balance-boxoffice/balance-boxoffice.module';
import { BalanceAccountModule } from 'src/app/modules/info-modules/balance/balance-account/balance-account.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [OrderinDocComponent,],
  imports: [
    CommonModule,
    OrderinDocRoutingModule,
    SettingsOrderinDialogModule,
    BalanceCagentModule,
    BalanceKassaModule,
    BalanceBoxofficeModule,
    BalanceAccountModule,    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class OrderinDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptanceDocRoutingModule } from './acceptance-doc-routing.module';
import { AcceptanceDocComponent } from './acceptance-doc.component';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsAcceptanceDialogModule } from '../../../../modules/settings/settings-acceptance-dialog/settings-acceptance-dialog.module';
import { AcceptanceProductsTableModule } from 'src/app/modules/trade-modules/acceptance-products-table/acceptance-products-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [AcceptanceDocComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','menu']}
  ],
  imports: [
    CommonModule,
    TemplatesDialogModule,
    AcceptanceDocRoutingModule,
    SettingsAcceptanceDialogModule,
    AcceptanceProductsTableModule,
    BalanceCagentModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ]
})
export class AcceptanceDocModule { }

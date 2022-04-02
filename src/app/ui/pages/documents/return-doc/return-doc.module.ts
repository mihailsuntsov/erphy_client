import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnDocRoutingModule } from './return-doc-routing.module';
import { ReturnDocComponent } from './return-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsReturnDialogModule } from '../../../../modules/settings/settings-return-dialog/settings-return-dialog.module';
import { ReturnProductsTableModule } from 'src/app/modules/trade-modules/return-products-table/return-products-table.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ReturnDocComponent],
  imports: [
    CommonModule,
    ReturnDocRoutingModule,
    SettingsReturnDialogModule,
    ReturnProductsTableModule,
    KkmModule,
    BalanceCagentModule,
    TemplatesDialogModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class ReturnDocModule { }

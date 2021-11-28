import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnDocRoutingModule } from './return-doc-routing.module';
import { ReturnDocComponent } from './return-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsReturnDialogModule } from '../../../../modules/settings/settings-return-dialog/settings-return-dialog.module';
import { ReturnProductsTableModule } from 'src/app/modules/trade-modules/return-products-table/return-products-table.module';
import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';

@NgModule({
  declarations: [ReturnDocComponent],
  imports: [
    CommonModule,
    ReturnDocRoutingModule,
    SettingsReturnDialogModule,
    ReturnProductsTableModule,
    KkmModule,
    BalanceCagentModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class ReturnDocModule { }

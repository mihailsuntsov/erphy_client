import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnsupDocRoutingModule } from './returnsup-doc-routing.module';
import { ReturnsupDocComponent } from './returnsup-doc.component';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
// import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsReturnsupDialogModule } from '../../../../modules/settings/settings-returnsup-dialog/settings-returnsup-dialog.module';
import { ReturnsupProductsTableModule } from 'src/app/modules/trade-modules/returnsup-products-table/returnsup-products-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
// import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';

@NgModule({
  declarations: [ReturnsupDocComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']}
  ],
  imports: [
    TemplatesDialogModule,
    CommonModule,
    ReturnsupDocRoutingModule,
    SettingsReturnsupDialogModule,
    ReturnsupProductsTableModule,
    BalanceCagentModule,
    // KkmModule,
    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
})
export class ReturnsupDocModule { }

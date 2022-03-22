import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderoutRoutingModule } from './orderout-routing.module';
import { OrderoutComponent } from './orderout.component';

import { SettingsOrderoutDialogModule } from '../../../../modules/settings/settings-orderout-dialog/settings-orderout-dialog.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [OrderoutComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    OrderoutRoutingModule,
    SettingsOrderoutDialogModule,
    BalanceCagentModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class OrderoutModule { }

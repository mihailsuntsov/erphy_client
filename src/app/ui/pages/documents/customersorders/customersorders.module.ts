import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersordersRoutingModule } from './customersorders-routing.module';
import { CustomersordersComponent } from './customersorders.component';
import { SettingsCustomersordersDialogModule } from '../../../../modules/settings/settings-customersorders-dialog/settings-customersorders-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CustomersordersComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    CustomersordersRoutingModule,
    SettingsCustomersordersDialogModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ]
})
export class CustomersordersModule { }

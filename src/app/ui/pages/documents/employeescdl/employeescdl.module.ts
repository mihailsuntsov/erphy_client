import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeeScdlRoutingModule } from './employeescdl-routing.module';
import { EmployeeScdlComponent } from './employeescdl.component';
import { UserLegalInfoModule } from '../../../../modules/user-legal-info/user-legal-info.module';
import { PaymentSelectModule } from '../../../../modules/payment-select/payment-select.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { ControlMessagesComponent } from './control-messages.component';

@NgModule({
  declarations: [EmployeeScdlComponent, ControlMessagesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    EmployeeScdlRoutingModule,
    ReactiveFormsModule,
    UserLegalInfoModule,
    PaymentSelectModule,
    FormsModule,
    MaterialModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ]
})
export class EmployeeScdlModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsDocRoutingModule } from './appointments-doc-routing.module';
import { AppointmentsDocComponent } from './appointments-doc.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';
import { TemplatesDialogModule } from '../../../../modules/settings/templates-dialog/templates-dialog.module';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { SettingsAppointmentsDialogModule } from '../../../../modules/settings/settings-customersorders-dialog/settings-customersorders-dialog.module';
import { ProductSearchAndTableModule } from 'src/app/modules/trade-modules/product-search-and-table/product-search-and-table.module';
import { BalanceCagentModule } from 'src/app/modules/info-modules/balance/balance-cagent/balance-cagent.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
// import { KkmModule } from 'src/app/modules/trade-modules/kkm/kkm.module';
import {NgxMaterialTimepickerModule} from 'ngx-material-timepicker';

@NgModule({
  declarations: [AppointmentsDocComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    AppointmentsDocRoutingModule,
    TemplatesDialogModule,
    // SettingsAppointmentsDialogModule,
    ProductSearchAndTableModule,
    BalanceCagentModule,
    // KkmModule,
  //
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgxMaterialTimepickerModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class AppointmentsDocModule { }

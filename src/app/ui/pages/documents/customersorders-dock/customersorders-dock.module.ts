import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersordersDockRoutingModule } from './customersorders-dock-routing.module';
import { CustomersordersDockComponent } from './customersorders-dock.component';
import { ControlMessagesComponent } from './control-messages.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsCustomersordersDialogModule } from '../../../dialogs/settings-customersorders-dialog/settings-customersorders-dialog.module';

@NgModule({
  declarations: [CustomersordersDockComponent, ControlMessagesComponent],
  imports: [
    CommonModule,
    CustomersordersDockRoutingModule,
    SettingsCustomersordersDialogModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class CustomersordersDockModule { }

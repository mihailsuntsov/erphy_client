import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersordersRoutingModule } from './customersorders-routing.module';
import { CustomersordersComponent } from './customersorders.component';
import { SettingsCustomersordersDialogModule } from '../../../dialogs/settings-customersorders-dialog/settings-customersorders-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [CustomersordersComponent],
  imports: [
    CommonModule,
    CustomersordersRoutingModule,
    SettingsCustomersordersDialogModule,
    
    MaterialModule,
    FormsModule,
  ]
})
export class CustomersordersModule { }

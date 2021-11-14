import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderoutRoutingModule } from './orderout-routing.module';
import { OrderoutComponent } from './orderout.component';

import { SettingsOrderoutDialogModule } from '../../../../modules/settings/settings-orderout-dialog/settings-orderout-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [OrderoutComponent],
  imports: [
    CommonModule,
    OrderoutRoutingModule,
    SettingsOrderoutDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class OrderoutModule { }

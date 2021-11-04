import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderinRoutingModule } from './orderin-routing.module';
import { OrderinComponent } from './orderin.component';

import { SettingsOrderinDialogModule } from '../../../../modules/settings/settings-orderin-dialog/settings-orderin-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [OrderinComponent],
  imports: [
    CommonModule,
    OrderinRoutingModule,
    SettingsOrderinDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class OrderinModule { }

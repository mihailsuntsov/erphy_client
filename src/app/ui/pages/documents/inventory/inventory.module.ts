import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryComponent } from './inventory.component';
import { SettingsInventoryDialogModule } from '../../../../modules/settings/settings-inventory-dialog/settings-inventory-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [InventoryComponent],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    SettingsInventoryDialogModule,

    MaterialModule,
    FormsModule
  ]
})
export class InventoryModule { }

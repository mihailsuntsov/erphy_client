import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryComponent } from './inventory.component';
import { SettingsInventoryDialogModule } from '../../../../modules/settings/settings-inventory-dialog/settings-inventory-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [InventoryComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    SettingsInventoryDialogModule,

    MaterialModule,
    TranslocoModule,
    FormsModule
  ]
})
export class InventoryModule { }

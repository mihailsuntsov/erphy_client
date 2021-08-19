import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryDockRoutingModule } from './inventory-dock-routing.module';
import { InventoryDockComponent } from './inventory-dock.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsInventoryDialogModule } from '../../../../modules/settings/settings-inventory-dialog/settings-inventory-dialog.module';
import { InventoryProductsTableModule } from 'src/app/modules/trade-modules/inventory-products-table/inventory-products-table.module';


@NgModule({
  declarations: [InventoryDockComponent],
  imports: [
    CommonModule,
    InventoryDockRoutingModule,
    SettingsInventoryDialogModule,
    InventoryProductsTableModule,

    
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class InventoryDockModule { }

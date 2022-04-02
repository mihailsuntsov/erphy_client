import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryDocRoutingModule } from './inventory-doc-routing.module';
import { InventoryDocComponent } from './inventory-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsInventoryDialogModule } from '../../../../modules/settings/settings-inventory-dialog/settings-inventory-dialog.module';
import { InventoryProductsTableModule } from 'src/app/modules/trade-modules/inventory-products-table/inventory-products-table.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [InventoryDocComponent],
  imports: [
    CommonModule,
    InventoryDocRoutingModule,
    SettingsInventoryDialogModule,
    InventoryProductsTableModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: ['docs','menu','modules']},ValidationService],
})
export class InventoryDocModule { }

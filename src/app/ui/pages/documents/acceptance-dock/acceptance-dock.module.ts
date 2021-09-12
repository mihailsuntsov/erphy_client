import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptanceDockRoutingModule } from './acceptance-dock-routing.module';
import { AcceptanceDockComponent } from './acceptance-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsAcceptanceDialogModule } from '../../../../modules/settings/settings-acceptance-dialog/settings-acceptance-dialog.module';
import { AcceptanceProductsTableModule } from 'src/app/modules/trade-modules/acceptance-products-table/acceptance-products-table.module';

@NgModule({
  declarations: [AcceptanceDockComponent],
  imports: [
    CommonModule,
    AcceptanceDockRoutingModule,
    SettingsAcceptanceDialogModule,
    AcceptanceProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AcceptanceDockModule { }

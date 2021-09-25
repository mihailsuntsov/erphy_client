import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MovingDockRoutingModule } from './moving-dock-routing.module';
import { MovingDockComponent } from './moving-dock.component';

import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsMovingDialogModule } from '../../../../modules/settings/settings-moving-dialog/settings-moving-dialog.module';
import { MovingProductsTableModule } from 'src/app/modules/trade-modules/moving-products-table/moving-products-table.module';

@NgModule({
  declarations: [MovingDockComponent],
  imports: [
    CommonModule,
    MovingDockRoutingModule,
    SettingsMovingDialogModule,
    MovingProductsTableModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MovingDockModule { }

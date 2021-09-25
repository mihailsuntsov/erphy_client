import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovingRoutingModule } from './moving-routing.module';
import { MovingComponent } from './moving.component';

import { SettingsMovingDialogModule } from '../../../../modules/settings/settings-moving-dialog/settings-moving-dialog.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [MovingComponent],
  imports: [
    CommonModule,
    MovingRoutingModule,

    SettingsMovingDialogModule,
    MaterialModule,
    FormsModule
  ]
})
export class MovingModule { }

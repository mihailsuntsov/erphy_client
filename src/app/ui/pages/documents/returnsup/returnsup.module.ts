import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnsupRoutingModule } from './returnsup-routing.module';
import { ReturnsupComponent } from './returnsup.component';

import { SettingsReturnDialogModule } from '../../../../modules/settings/settings-return-dialog/settings-return-dialog.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [ReturnsupComponent],
  imports: [
    CommonModule,
    ReturnsupRoutingModule,

    SettingsReturnDialogModule,
    MaterialModule,
    FormsModule
  ]
})
export class ReturnsupModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CorrectionRoutingModule } from './correction-routing.module';
import { CorrectionComponent } from './correction.component';

import { SettingsCorrectionDialogModule } from '../../../../modules/settings/settings-correction-dialog/settings-correction-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [CorrectionComponent],
  imports: [
    CommonModule,
    CorrectionRoutingModule,
    SettingsCorrectionDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class CorrectionModule { }

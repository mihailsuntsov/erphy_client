import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CorrectionRoutingModule } from './correction-routing.module';
import { CorrectionComponent } from './correction.component';

import { SettingsCorrectionDialogModule } from '../../../../modules/settings/settings-correction-dialog/settings-correction-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CorrectionComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    CorrectionRoutingModule,
    SettingsCorrectionDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class CorrectionModule { }

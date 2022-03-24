import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WriteoffRoutingModule } from './writeoff-routing.module';
import { WriteoffComponent } from './writeoff.component';

import { SettingsWriteoffDialogModule } from '../../../../modules/settings/settings-writeoff-dialog/settings-writeoff-dialog.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [WriteoffComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    WriteoffRoutingModule,
    
    SettingsWriteoffDialogModule,
    FormsModule,
    MaterialModule,
    TranslocoModule,
  ]
})
export class WriteoffModule { }

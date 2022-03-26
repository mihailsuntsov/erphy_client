import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcceptanceRoutingModule } from './acceptance-routing.module';
import { AcceptanceComponent } from './acceptance.component';

import { SettingsAcceptanceDialogModule } from '../../../../modules/settings/settings-acceptance-dialog/settings-acceptance-dialog.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [AcceptanceComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu'}
  ],
  imports: [
    CommonModule,
    AcceptanceRoutingModule,
    
    SettingsAcceptanceDialogModule,
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class AcceptanceModule { }

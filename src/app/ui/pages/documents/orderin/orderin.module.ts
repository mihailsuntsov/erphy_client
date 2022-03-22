import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderinRoutingModule } from './orderin-routing.module';
import { OrderinComponent } from './orderin.component';

import { SettingsOrderinDialogModule } from '../../../../modules/settings/settings-orderin-dialog/settings-orderin-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [OrderinComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    OrderinRoutingModule,
    SettingsOrderinDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class OrderinModule { }

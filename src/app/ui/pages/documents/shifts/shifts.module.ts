import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShiftsRoutingModule } from './shifts-routing.module';
import { ShiftsComponent } from './shifts.component';

// import { SettingsShiftsDialogModule } from '../../../../modules/settings/settings-shifts-dialog/settings-shifts-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [ShiftsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    ShiftsRoutingModule,
    // SettingsShiftsDialogModule,
    
    FormsModule,
    MaterialModule,
    TranslocoModule
  ]
})
export class ShiftsModule { }

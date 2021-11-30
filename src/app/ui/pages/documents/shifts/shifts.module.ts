import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShiftsRoutingModule } from './shifts-routing.module';
import { ShiftsComponent } from './shifts.component';

// import { SettingsShiftsDialogModule } from '../../../../modules/settings/settings-shifts-dialog/settings-shifts-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';

@NgModule({
  declarations: [ShiftsComponent],
  imports: [
    CommonModule,
    ShiftsRoutingModule,
    // SettingsShiftsDialogModule,
    
    FormsModule,
    MaterialModule
  ]
})
export class ShiftsModule { }

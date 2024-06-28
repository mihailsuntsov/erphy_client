import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsComponent } from './appointments.component';
import { SettingsAppointmentsDialogModule } from '../../../../modules/settings/settings-appointments-dialog/settings-appointments-dialog.module';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [AppointmentsComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule,
    SettingsAppointmentsDialogModule,
    
    MaterialModule,
    FormsModule,
    TranslocoModule
  ],
  exports: [AppointmentsComponent],
})
export class AppointmentsModule { }

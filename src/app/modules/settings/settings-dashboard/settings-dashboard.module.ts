import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsDashboardComponent } from './settings-dashboard.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [SettingsDashboardComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class SettingsDashboardModule { }

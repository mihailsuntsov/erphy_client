import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SalesOnPeriodModule } from 'src/app/modules/info-modules/sales-on-period/sales-on-period.module';
import {SettingsDashboardModule} from 'src/app/modules/settings/settings-dashboard/settings-dashboard.module'

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    SalesOnPeriodModule,
    SettingsDashboardModule
  ]
})
export class DashboardModule { }

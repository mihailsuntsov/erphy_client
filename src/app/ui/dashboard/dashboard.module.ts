import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../modules/material.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SalesOnPeriodModule } from 'src/app/modules/info-modules/sales-on-period/sales-on-period.module';
import { IncomeOutcomeModule } from 'src/app/modules/info-modules/income-outcome/income-outcome.module';
import { IndicatorsLeftModule } from 'src/app/modules/info-modules/indicators-left/indicators-left.module';
import {SettingsDashboardModule} from 'src/app/modules/settings/settings-dashboard/settings-dashboard.module'

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    SalesOnPeriodModule,
    IncomeOutcomeModule,
    IndicatorsLeftModule,
    SettingsDashboardModule
  ]
})
export class DashboardModule { }

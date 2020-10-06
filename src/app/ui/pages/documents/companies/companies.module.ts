import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../modules/material.module';
import { CompaniesRoutingModule } from './companies-routing.module';
import { CompaniesComponent } from './companies.component';


@NgModule({
  declarations: [CompaniesComponent],
  imports: [
    CommonModule,
    CompaniesRoutingModule,
    MaterialModule
  ]
})
export class CompaniesModule { }

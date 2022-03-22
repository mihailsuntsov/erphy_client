import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompaniesRoutingModule } from './companies-routing.module';
import { CompaniesComponent } from './companies.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [CompaniesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    CompaniesRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    TranslocoModule
  ]
})
export class CompaniesModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompaniesDockRoutingModule } from './companies-dock-routing.module';
import { CompaniesDockComponent } from './companies-dock.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';


@NgModule({
  declarations: [CompaniesDockComponent],
  imports: [
    CommonModule,
    CompaniesDockRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class CompaniesDockModule { }

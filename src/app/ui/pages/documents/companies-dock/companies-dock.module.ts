import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CompaniesDockRoutingModule } from './companies-dock-routing.module';
import { CompaniesDockComponent } from './companies-dock.component';


@NgModule({
  declarations: [CompaniesDockComponent],
  imports: [
    CommonModule,
    CompaniesDockRoutingModule
  ]
})
export class CompaniesDockModule { }

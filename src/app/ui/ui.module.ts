import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { UiRoutingModule } from './ui-routing.module';
import { UiComponent } from './ui.component';


@NgModule({
  declarations: [UiComponent],
  imports: [
    CommonModule,
    UiRoutingModule,
    MaterialModule
  ]
})
export class UiModule { }

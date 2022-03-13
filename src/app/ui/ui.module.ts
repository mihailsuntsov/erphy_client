import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { UiRoutingModule } from './ui-routing.module';
import { UiComponent } from './ui.component';
import { AppComponent } from "../app.component";
import { TranslocoModule } from "@ngneat/transloco";

@NgModule({
  declarations: [UiComponent],
  imports: [
    CommonModule,
    UiRoutingModule,
    MaterialModule,
    TranslocoModule
  ],
  bootstrap: [AppComponent]
})
export class UiModule { }

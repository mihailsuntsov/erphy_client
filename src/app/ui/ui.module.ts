import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { UiRoutingModule } from './ui-routing.module';
import { UiComponent } from './ui.component';
import { AppComponent } from "../app.component";
import { TranslocoModule } from "@ngneat/transloco";
import { UserSettingsDialogModule } from "src/app/modules/settings/user-settings-dialog/user-settings-dialog.module";

@NgModule({
  declarations: [UiComponent],
  imports: [
    CommonModule,
    UiRoutingModule,
    MaterialModule,
    TranslocoModule,
    UserSettingsDialogModule
  ],
  bootstrap: [AppComponent]
})
export class UiModule { }

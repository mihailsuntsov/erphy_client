import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrectionDocRoutingModule } from './correction-doc-routing.module';
import { CorrectionDocComponent } from './correction-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsCorrectionDialogModule } from '../../../../modules/settings/settings-correction-dialog/settings-correction-dialog.module';

@NgModule({
  declarations: [CorrectionDocComponent, /*ControlMessagesComponent*/],
  imports: [
    CommonModule,
    CorrectionDocRoutingModule,
    SettingsCorrectionDialogModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class CorrectionDocModule { }

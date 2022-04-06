import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsAcceptanceDialogComponent } from './settings-acceptance-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SettingsAcceptanceDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsAcceptanceDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsAcceptanceDialogModule { }

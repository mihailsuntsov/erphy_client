import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsOrderoutDialogComponent } from './settings-orderout-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@NgModule({
  declarations: [SettingsOrderoutDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsOrderoutDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsOrderoutDialogModule { }

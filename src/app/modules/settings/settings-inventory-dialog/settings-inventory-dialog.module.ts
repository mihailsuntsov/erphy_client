import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsInventoryDialogComponent } from './settings-inventory-dialog.component';

import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';


@NgModule({
  declarations: [SettingsInventoryDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule
  ],
  exports: [
    SettingsInventoryDialogComponent,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: ['docs','modules']},]
})
export class SettingsInventoryDialogModule { }

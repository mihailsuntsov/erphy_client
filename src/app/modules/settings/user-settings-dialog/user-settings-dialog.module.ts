import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSettingsDialogComponent } from './user-settings-dialog.component';
import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [UserSettingsDialogComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    UserSettingsDialogComponent,
  ],
})
export class UserSettingsDialogModule { }

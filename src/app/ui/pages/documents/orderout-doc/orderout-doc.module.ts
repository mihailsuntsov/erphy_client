import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderoutDocRoutingModule } from './orderout-doc-routing.module';
import { OrderoutDocComponent } from './orderout-doc.component';
import { ValidationService } from './validation.service';
import { MaterialModule } from '../../../../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsOrderoutDialogModule } from '../../../../modules/settings/settings-orderout-dialog/settings-orderout-dialog.module';

@NgModule({
  declarations: [OrderoutDocComponent,],
  imports: [
    CommonModule,
    OrderoutDocRoutingModule,
    SettingsOrderoutDialogModule,

    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [ValidationService],
})
export class OrderoutDocModule { }

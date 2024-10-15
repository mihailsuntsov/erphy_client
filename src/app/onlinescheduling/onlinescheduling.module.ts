import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../modules/shared.module';
import { OnlineschedulingComponent } from './onlinescheduling.component';
import { OnlineschedulingRoutingModule } from './onlinescheduling-routing.module';
import { OsDialogComponent } from './osdialog.component';


@NgModule({
  declarations: [
    OnlineschedulingComponent,
    OsDialogComponent
  ],
  imports: [
    CommonModule,
    OnlineschedulingRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  exports: [
    OsDialogComponent
  ]
})
export class OnlineschedulingModule { }

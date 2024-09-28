import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../modules/shared.module';
import { OnlineschedulingComponent } from './onlinescheduling.component';
import { OnlineschedulingRoutingModule } from './onlinescheduling-routing.module';



@NgModule({
  declarations: [
    OnlineschedulingComponent
  ],
  imports: [
    CommonModule,
    OnlineschedulingRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class OnlineschedulingModule { }

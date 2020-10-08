import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsergroupDockRoutingModule } from './usergroup-dock-routing.module';
import { UsergroupDockComponent } from './usergroup-dock.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [UsergroupDockComponent],
  imports: [
    CommonModule,
    UsergroupDockRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule,
  ]
})
export class UsergroupDockModule { }

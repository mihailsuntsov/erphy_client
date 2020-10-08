import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersDockRoutingModule } from './users-dock-routing.module';
import { UsersDockComponent } from './users-dock.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [UsersDockComponent],
  imports: [
    CommonModule,
    UsersDockRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule,
  ]
})
export class UsersDockModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsergroupRoutingModule } from './usergroup-routing.module';
import { UsergroupComponent } from './usergroup.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [UsergroupComponent],
  imports: [
    CommonModule,
    UsergroupRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class UsergroupModule { }

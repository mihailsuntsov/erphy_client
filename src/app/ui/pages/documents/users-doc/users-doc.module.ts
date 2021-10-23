import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersDocRoutingModule } from './users-doc-routing.module';
import { UsersDocComponent } from './users-doc.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [UsersDocComponent],
  imports: [
    CommonModule,
    UsersDocRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule,
  ]
})
export class UsersDocModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsergroupDocRoutingModule } from './usergroup-doc-routing.module';
import { UsergroupDocComponent } from './usergroup-doc.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [UsergroupDocComponent],
  imports: [
    CommonModule,
    UsergroupDocRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModule,
  ]
})
export class UsergroupDocModule { }

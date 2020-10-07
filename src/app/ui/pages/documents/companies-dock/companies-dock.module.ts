import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompaniesDockRoutingModule } from './companies-dock-routing.module';
import { CompaniesDockComponent } from './companies-dock.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [CompaniesDockComponent],
  imports: [
    CommonModule,
    CompaniesDockRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DragDropModule,
  ]
})
export class CompaniesDockModule { }

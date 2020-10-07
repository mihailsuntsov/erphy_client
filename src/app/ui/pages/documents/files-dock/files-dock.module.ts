import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesDockRoutingModule } from './files-dock-routing.module';
import { FilesDockComponent } from './files-dock.component';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [FilesDockComponent],
  imports: [
    CommonModule,
    FilesDockRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    
  ]
})
export class FilesDockModule { }

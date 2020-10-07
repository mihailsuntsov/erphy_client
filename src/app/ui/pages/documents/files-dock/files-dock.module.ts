import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesDockRoutingModule } from './files-dock-routing.module';
import { FilesDockComponent } from './files-dock.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';

@NgModule({
  declarations: [FilesDockComponent],
  imports: [
    CommonModule,
    FilesDockRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule
  ]
})
export class FilesDockModule { }

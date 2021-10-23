import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesDocRoutingModule } from './files-doc-routing.module';
import { FilesDocComponent } from './files-doc.component';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [FilesDocComponent],
  imports: [
    CommonModule,
    FilesDocRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    
  ]
})
export class FilesDocModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesRoutingModule } from './files-routing.module';
import { FilesComponent } from './files.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { UploadsModule } from '../../../../modules/uploads.module';
@NgModule({
  declarations: [FilesComponent],
  imports: [
    CommonModule,
    FilesRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    UploadsModule
  ]
})
export class FilesModule { }

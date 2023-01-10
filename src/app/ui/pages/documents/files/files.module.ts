import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesRoutingModule } from './files-routing.module';
import { FilesComponent } from './files.component';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../modules/material.module';
import { SharedModule } from '../../../../modules/shared.module';
import { UploadsModule } from '../../../../modules/uploads.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { FileCategoriesSelectModule } from 'src/app/modules/trade-modules/file-categories-select/file-categories-select.module';
@NgModule({
  declarations: [FilesComponent],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'menu' }
  ],
  imports: [
    CommonModule,
    FilesRoutingModule,
    MaterialModule,
    FormsModule,
    SharedModule,
    UploadsModule,
    TranslocoModule,
    FileCategoriesSelectModule
  ]
})
export class FilesModule { }

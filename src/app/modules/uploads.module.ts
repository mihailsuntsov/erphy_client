// Модуль для функционирования загрузки файлов
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListUploadComponent } from '../services/upload/list-upload/list-upload.component';
import { FormUploadComponent } from '../services/upload/form-upload/form-upload.component';
import { DetailsUploadComponent } from '../services/upload/details-upload/details-upload.component';
import { UploadFileService } from '../services/upload/upload-file.service';
import { MaterialModule } from '../modules/material.module';

@NgModule({
  declarations: [
    ListUploadComponent,
    FormUploadComponent,
    DetailsUploadComponent,
  ],
  imports: [
    MaterialModule,
    CommonModule,
  ],
  exports: [
  ],
  providers: [
    UploadFileService,
  ],
})
export class UploadsModule { }

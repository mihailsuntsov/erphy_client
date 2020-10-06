import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpResponse, HttpEventType } from '@angular/common/http';
import { UploadFileService } from '../upload-file.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'form-upload',
  templateUrl: './form-upload.component.html',
  styleUrls: ['./form-upload.component.css']
})
export class FormUploadComponent implements OnInit {
 
  selectedFiles: FileList;
  currentFileUpload: File;
  //fileName:string='';
  progress: { percentage: number } = { percentage: 0 };
 
  constructor(private uploadService: UploadFileService,private _snackBar: MatSnackBar) { }
 
  ngOnInit() {
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  selectFile(event) {
    const file = event.target.files.item(0);

    if (file.type=='image/jpeg') 
    {
      if (file.size<=(1 * 1024 * 1024)) // = 1 Mb
      {
        this.selectedFiles = event.target.files;
        // console.log("selectedFiles name="+this.selectedFiles[0].name);
        //this.fileName = this.selectedFiles[0].name;
        // console.log("fileName="+this.fileName);
        // console.log("fileSize="+file.size);
        // console.log("fileType="+file.type);
        this.upload();
      } else {
        alert('Размер файла должен быть не более 1 Мб');
      }
    } else {
      alert('Файл не является картинкой формата \"JPEG\"');
    }
  }
 
  upload() {
    this.progress.percentage = 0;
 
    this.currentFileUpload = this.selectedFiles.item(0);
    this.uploadService.pushFileToStorage(this.currentFileUpload,'1').subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        this.progress.percentage = Math.round(100 * event.loaded / event.total);
      } else if (event instanceof HttpResponse) {
        this.openSnackBar("Файл загружен", "Закрыть");
        this.currentFileUpload=null;
      }
    });
 
    this.selectedFiles = undefined;
  }
}
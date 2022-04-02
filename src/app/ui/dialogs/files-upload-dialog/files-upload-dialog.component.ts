import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UploadFileService } from './upload-file.service';
import { HttpClient, HttpResponse, HttpEventType } from '@angular/common/http';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-files-upload-dialog',
  templateUrl: './files-upload-dialog.component.html',
  styleUrls: ['./files-upload-dialog.component.css'],
  providers: [UploadFileService]
})
export class FilesUploadDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  url: string; 
  checked: boolean = false;

  // *****  переменные файлов   ***** 
// imagesInfo : imagesInfo []; //массив для получения информации по картинкам товара
// selectedFiles: FileList;
currentFileUpload: File;
progress: { percentage: number } = { percentage: 0 };
mainImageAddress: string; // имя или адрес главной картинки

totalFiles:number=0;
currentIndexFileArray:number=0;
filesArray: File[]=[];
countUploadedFiles:number = 0;
uploadingFileName:string;
maxFileSize:number = 10 * 1024 * 1024; // = 10 Mb; Также нужно менять в Java (config/AppInit переменная maxUploadSizeInMb)

  constructor(
    public dialogRef: MatDialogRef<FilesUploadDialogComponent>,
    private MessageDialog: MatDialog,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    private uploadService: UploadFileService,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
    
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    console.log("data.categoryId:"+this.data.categoryId);
    console.log("data.companyId:"+this.data.companyId);
    console.log("data.categoryName:"+this.data.categoryName);
    this.formBaseInformation = new FormGroup({
      categoryId:     new FormControl (+this.data.categoryId,[]),//id категории для файлов (ПУСТО - КОРНЕВАЯ БУДЕТ)
      anonyme_access: new FormControl (false,[]),
      companyId:      new FormControl (+this.data.companyId,[]),//id выбранного предприятия
      sharedFile:     new FormControl (this.checked,[]),
      description:    new FormControl ('',[]),
    });
  }

  clickBtnOpenFile(){
    console.log("sharedFile - "+this.formBaseInformation.get('sharedFile').value);
  }

   selectFile(event) {
    let countUploadedFiles:number = 0;
    this.filesArray = event.target.files;
    this.totalFiles=this.filesArray.length;

    if(this.totalFiles<=10)
    this.upload(this.filesArray[this.currentIndexFileArray]);
    else{
      this.aboutMaxCountFiles();
    }
   
  }

  upload(file:File){
    this.progress.percentage = 0;
    this.currentFileUpload = file;
    console.log(file.name);

    if (file.size<=(this.maxFileSize))
    {
      this.uploadingFileName=file.name;
      this.uploadService.pushFileToStorage(
        this.currentFileUpload,
       +this.data.companyId,
        this.formBaseInformation.get('sharedFile').value,
        this.formBaseInformation.get('description').value,
       +this.formBaseInformation.get('categoryId').value).
       subscribe(event => {
       if (event.type === HttpEventType.UploadProgress) {
         this.progress.percentage = Math.round(100 * event.loaded / event.total);
       } else if (event instanceof HttpResponse) {
        this.currentFileUpload=null;
         this.countUploadedFiles++;
         this.nextFileSwitcher();
       }
     });
    } else {
      this.aboutMaxSize(file.name,(file.size/1024/1024).toFixed(2));
      
    }
    
  }

  nextFileSwitcher(){
    this.currentIndexFileArray++;
    if(this.currentIndexFileArray<this.totalFiles){
      this.upload(this.filesArray[this.currentIndexFileArray]);
    } else {
    if(this.countUploadedFiles>0){
    this.openSnackBar("Файлы загружены. Всего загруженных файлов: "+this.countUploadedFiles, "Закрыть");
    } else this.openSnackBar("Файлы не были загружены", "Закрыть");
    this.onNoClick();
    }
  }




  
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  aboutSharedFiles(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: 'Файл для общего доступа',
        message: 'Если файл открыт для общего доступа, на него не распространяются права категорий, к которым он относится, и его можно скачать по внешней ссылке. Данная опция нужна для для картинок сайта, фото товаров интернет-магазина и др.'
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }

  aboutDescription(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: 'Описание файла',
        message: 'Описание файла - это краткая текстовая заметка по загружаемому файлу.'
      },
    });
    dialogRef.afterClosed().subscribe(result => {});  
  }

  aboutMaxCountFiles(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: 'Количество файлов',
        message: 'Максимальное количество файлов для одной операции загрузки равно 10. Пожалуйста, выберите меньшее количество файлов.'
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.filesArray = null;
      this.onNoClick;
    });  
  }

  aboutMaxSize(fileName:string, fileSize:string){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: 'Размер файла',
        message: 'Файл '+fileName+' размером '+fileSize+' Мб., превышает максимально допустимый для загрузки размер файла, равный '+this.maxFileSize/1024/1024+' Мб.',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.nextFileSwitcher();
    });  
  }

}

import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { MatSnackBar} from '@angular/material/snack-bar';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UploadFileService } from './upload-file.service';
import { HttpClient, HttpResponse, HttpEventType } from '@angular/common/http';
import { translate } from '@ngneat/transloco'; //+++
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';

@Component({
  selector: 'app-files-upload-dialog',
  templateUrl: './files-upload-dialog.component.html',
  styleUrls: ['./files-upload-dialog.component.css'],
  providers: [UploadFileService,Cookie,CommonUtilitesService]
})
export class FilesUploadDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  url: string; 
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
maxFileSize:number = 0; // = 10 Mb; Также нужно менять в Java (config/AppInit переменная maxUploadSizeInMb)

  constructor(
    public dialogRef: MatDialogRef<FilesUploadDialogComponent>,
    private MessageDialog: MatDialog,
    private Cookie: Cookie,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    private uploadService: UploadFileService,
    private commonUtilites: CommonUtilitesService,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
    
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.maxFileSize=this.commonUtilites.getMaxFileSize();
    // console.log("data.categoryId:"+this.data.categoryId);
    // console.log("data.companyId:"+this.data.companyId);
    // console.log("data.categoryName:"+this.data.categoryName);
    this.formBaseInformation = new UntypedFormGroup({
      categoryId:     new UntypedFormControl (+this.data.categoryId,[]),//id категории для файлов (ПУСТО - КОРНЕВАЯ БУДЕТ)
      // anonyme_access: new UntypedFormControl (false,[]),
      companyId:      new UntypedFormControl (+this.data.companyId,[]),//id выбранного предприятия
      sharedFile:     new UntypedFormControl (false,[]),
      description:    new UntypedFormControl ('',[]),
    });
    
    // auto-open file selection window
    document.getElementById('fileToUpload').click();
    try{
      if(Cookie.get('files_anonyme_access')=='undefined' || Cookie.get('files_anonyme_access')==null)       
        Cookie.set('files_anonyme_access',this.formBaseInformation.get('sharedFile').value); else this.formBaseInformation.get('sharedFile').setValue(this.setSharedFileOnCookie());
    } catch(e) {
      console.log(e);
    }
  }



  clickBtnOpenFile(){
    // console.log("sharedFile - "+this.formBaseInformation.get('sharedFile').value);
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
    // console.log(file.name);

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
        } else 
          if (event instanceof HttpResponse) {
            switch(event.body){   
              case null:{// null возвращает если не удалось создать документ из-за ошибки 
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.crte_doc_err',{name:translate('docs.docs.file')})}}); 
                break;
              }
              case "-1":{//недостаточно прав
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}});
                break;
              }
              case "-120":{//if current file will be uploaded, then sum size of all master-user files will out of bounds of tariff plan
                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.out_of_plan')}});
                break;
              }
              default:{//успешно создалась в БД 
                this.currentFileUpload=null;
                this.countUploadedFiles++;
                this.nextFileSwitcher();
              }
            }
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
      this.openSnackBar(translate('modules.msg.files_uploadd')+this.countUploadedFiles, translate('modules.button.close'));
    } else this.openSnackBar(translate('modules.msg.files_no_upld'), translate('modules.button.close'));
      this.onNoClick();
    }
  }
  
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 5000,
    });
  }

  aboutMaxCountFiles(){
    const dialogRef = this.MessageDialog.open(MessageDialog, {
      width: '400px',
      data:
      { 
        head: translate('modules.msg.files_amount'),
        message: translate('modules.msg.files_amount_')
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
        head: translate('modules.msg.file_size'),
        message: translate('modules.msg.file_')+fileName+translate('modules.msg._with_size_')+fileSize+translate('modules.msg._mb_')+translate('modules.msg._more_than')+this.maxFileSize/1024/1024+translate('modules.msg._mb_'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      this.nextFileSwitcher();
    });  
  }  
  
  onAnonymeAccessChange(){
    Cookie.set('files_anonyme_access',this.formBaseInformation.get('sharedFile').value);
  }

  // as a cookie contains text information, but sharedFile needs to get boolean
  setSharedFileOnCookie():boolean{
    switch (Cookie.get('files_anonyme_access')) {
      // case 'true'||true: return true;
      // case 'false'||false: return false;    
      case 'true': return true;
      case 'false': return false;    
    }
  }


}

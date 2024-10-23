import { Component, Inject, Optional } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { MatDialog, MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilesComponent } from 'src/app/ui/pages/documents/files/files.component';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadFileService } from 'src/app/ui/dialogs/files-upload-dialog/upload-file.service';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.css'],
  providers: [UploadFileService,CommonUtilitesService]
})

export class ImageUploaderComponent {

  name = 'Angular';
  imageChangedEvent: any = '';
  imageBlob: any = '';
  croppedImage: any = '';
  roundCropper: boolean = true;
  maxFileSize:number = 0;
  progress: { percentage: number } = { percentage: 0 };
  currentFileUpload: File;
  fileName:string='';
  isUploading:boolean=false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogFastScedule: MatDialogRef<ImageUploaderComponent>,
    public dialogAddImages: MatDialog,
    private http: HttpClient,
    private uploadService: UploadFileService,
    private MessageDialog: MatDialog,
    public commonUtilites: CommonUtilitesService,
  ){
    
  }

  ngOnInit() {
    // document.getElementById('fileToUpload').click();
    this.maxFileSize=this.commonUtilites.getMaxFileSize();
  }

  onNoClick(fileId?:number): void {
    this.dialogFastScedule.close(fileId);
  }

  applySelect(){
    this.dialogFastScedule.close(1);
  }
  
  fileChangeEvent(event: any): void {
    console.log('Original event',event)
    const file = event.target['files'][0];
    const fileReader = new FileReader();
    this.fileName = file.name;
    console.log('fileName',this.fileName)
    fileReader.addEventListener("load", () => {
      // this.doSomethingWithTheResult(fileReader.result);
      this.imageBlob=new Blob([fileReader.result], {type: 'image/png'});
      console.log('imageBlob: ', this.imageBlob);
    }, false);
    fileReader.readAsArrayBuffer(file); 
  }

  imageCropped(event: ImageCroppedEvent) {
    console.log('imageCropped event',event)
    this.createImageFromBlob(event.blob);
    this.currentFileUpload = new File([event.blob], this.fileName);
      // this.croppedImage = event.objectUrl; // if output="blob"
      // this.croppedImage = event.base64;    // if output="base64"
  }
  imageLoaded() {
      // show cropper
  }
  cropperReady() {
      // cropper ready
  }
  loadImageFailed() {
      // show message
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
        this.croppedImage = reader.result;
    }, false);
    if (image) {
      console.log(image)
        reader.readAsDataURL(image);
    }
  }



  openDialogSelectFile() {
    const dialogRef = this.dialogAddImages.open(FilesComponent, {
      width:  '90%', 
      height: '90%',
      data:
      { 
        mode: 'select',
        companyId: this.data.companyId,
        maxSelectFilesQtt:1
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.getImage('/api/auth/getFileImageById?file_id=' + result[0]+'&is_full_size=true').subscribe(blob => {
        this.imageBlob=blob;
      });

      this.http.get('/api/auth/getFileIinfoById/' + result[0]).subscribe(data => {
        let result = data as any;
        this.fileName = result.original_name;
        console.log('fileName', this.fileName)
      });
    });
  }

  getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  resetSelection(){
    this.imageBlob='';
    this.croppedImage='';
  }

  upload(){
    this.progress.percentage = 0;
    // this.currentFileUpload = file;
    // console.log(file.name);

    if (this.currentFileUpload.size<=(this.maxFileSize))
    {
      // let uploadingFileName=file.name;
      this.isUploading=true;
      this.uploadService.pushFileToStorage(
        this.currentFileUpload,
        this.data.companyId,
        true,
        '',
        0).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress.percentage = Math.round(100 * event.loaded / event.total);
        } else 
          if (event instanceof HttpResponse) {
            let result = event.body as any;
            switch(result){   
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
                this.onNoClick(result);
              }
            }
            this.isUploading=false;
          }
      });
    } else {
      this.isUploading=false;
      this.aboutMaxSize(this.currentFileUpload.name,(this.currentFileUpload.size/1024/1024).toFixed(2));
    }
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
   
    });  
  } 

}




import { Component, Inject, Optional } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { MatDialog, MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilesComponent } from 'src/app/ui/pages/documents/files/files.component';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.css']
})

export class ImageUploaderComponent {

  name = 'Angular';
  imageChangedEvent: any = '';
  imageBlob: any = '';
  croppedImage: any = '';
  roundCropper: boolean = true;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogFastScedule: MatDialogRef<ImageUploaderComponent>,
    public dialogAddImages: MatDialog,
    private http: HttpClient,
  ){
    
  }

  ngOnInit() {
    // document.getElementById('fileToUpload').click();
  }

  onNoClick(): void {
    this.dialogFastScedule.close();
  }

  applySelect(){
    this.dialogFastScedule.close(1);
  }
  
  fileChangeEvent(event: any): void {
    console.log('Original event',event)
    const file = event.target['files'][0];
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      // this.doSomethingWithTheResult(fileReader.result);
      this.imageBlob=new Blob([fileReader.result], {type: 'image/png'});
      console.log('imageBlob: ', this.imageBlob);
    }, false);
    fileReader.readAsArrayBuffer(file); 
  }

  imageCropped(event: ImageCroppedEvent) {
    console.log('imageCropped event',event)
    this.createImageFromBlob(event.blob)
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
      this.getImage('/api/auth/getFileImageById/' + result[0]).subscribe(blob => {
      // this.getImage('/api/auth/getFileImageThumb/4f7176cc-21b-2024-10-20-17-49-53-161_encrypted.JPG').subscribe(blob => {
        this.imageBlob=blob;
        // console.log('imageBlob: ', this.imageBlob);
        // this.createImageFromBlob(blob);
    });
      // if(result && type=='image')this.addImagesToProduct(result); else this.addDownloadableFilesToProduct(result);//product downloadable files
    });
  }

  getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  resetSelection(){
    this.imageBlob='';
    this.croppedImage='';
  }
}




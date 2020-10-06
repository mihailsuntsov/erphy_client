import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , Inject, OnInit} from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient} from '@angular/common/http';

@Component({
    selector: 'messagedialog',
    template:` 
    <div 
    style="
    text-align:  center; 
    max-width:1200px;
    max-height: 800px;
    /*overflow: hidden;*/
    display: flex;
    ">
    <img (click)="onNoClick()" class="file_preview" [src]="imageToShow"
    style="
    margin: auto;
    object-fit: contain; /*cover - заполнит всё, но залезет за границы*/
    width: 95%;
    max-height: 780px;
    max-width:1200px;
    transition: 0.3s ease;
    "
    >
    </div>`,
  })

export class ShowImageDialog  implements OnInit {

  imageToShow:any; // переменная в которую будет подгружаться картинка файла (если он jpg или png)
    
  constructor(
      public dialogRef: MatDialogRef<ShowImageDialog>,
      private http: HttpClient,
      @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.getImage();
  }

  getImage(){
    this.getImageService('/api/auth/getFile/' + this.data.link).subscribe(blob => {
      this.createImageFromBlob(blob);
    });
  }

  getImageService(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }
  
  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
        this.imageToShow = reader.result;
    }, false);
    if (image) {
        reader.readAsDataURL(image);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }



}
  
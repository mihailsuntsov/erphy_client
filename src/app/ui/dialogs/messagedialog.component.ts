import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , Inject} from '@angular/core';

@Component({
    selector: 'messagedialog',
    template:` 
    <div style="text-align:  center;">
    <h1 mat-dialog-title >{{data.head}}</h1>
    <div mat-dialog-content>
      <p>{{data.message}}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-raised-button color="primary" (click)="onNoClick()" style="flex-grow: 1;">Ok</button>
    </div>
    </div>`,
  })
  
  
  export class MessageDialog  {
// в этот диалог надо заинжектить параметры head, message, например:
// data:{head:'Удаление', message:'Все связанные с этим параметром документы тоже будут удалены'}

    constructor(
      public dialogRef: MatDialogRef<MessageDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any) {}
    onNoClick(): void {
      this.dialogRef.close();
    }



  }
  
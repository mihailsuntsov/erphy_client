import {MatDialogRef} from '@angular/material/dialog';
import { Component } from '@angular/core';


@Component({
    selector: 'deletedialog',
    template:` 
    <div style="text-align:  center;">
    <h1 mat-dialog-title >Удаление</h1>
    <div mat-dialog-content>
      <p>Удалить выбранные позиции?</p>
    </div>
    <div mat-dialog-actions>
      <button mat-raised-button color="warn" [mat-dialog-close]="1" style="flex-grow: 1;" cdkFocusInitial>Да</button>
      <button mat-raised-button color="primary" (click)="onNoClick()" style="flex-grow: 1;">Нет</button>
    </div>
    </div>`,
  })
    
  export class DeleteDialog  {

    constructor(
      public dialogRef: MatDialogRef<DeleteDialog>) {}
    onNoClick(): void {
      this.dialogRef.close();
    }

  }
  
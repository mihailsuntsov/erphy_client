import {MatDialogRef} from '@angular/material/dialog';
import { Component } from '@angular/core';


@Component({
    selector: 'deletedialog',
    template:` 
      <div style="text-align:  center;" *transloco="let t">
        <h1 mat-dialog-title >{{t('menu.dialogs.deleting')}}</h1>
        <div mat-dialog-content>
          <p>{{t('menu.dialogs.q_delete')}}</p>
        </div>
        <div mat-dialog-actions>
          <button mat-raised-button color="warn" [mat-dialog-close]="1" style="flex-grow: 1;" cdkFocusInitial>{{t('menu.dialogs.yes')}}</button>
          <button mat-raised-button color="primary" (click)="onNoClick()" style="flex-grow: 1;">{{t('menu.dialogs.no')}}</button>
        </div>
      </div>
    `,
  })
    
  export class DeleteDialog  {

    constructor(
      public dialogRef: MatDialogRef<DeleteDialog>,) {}
    onNoClick(): void {
      this.dialogRef.close();
    }

  }
  
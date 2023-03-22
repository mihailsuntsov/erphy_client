import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , Inject} from '@angular/core'; 

@Component({
    selector: 'deletedialog',
    template:` 
    <div style="text-align:  center;" *transloco="let t">
    <h1 mat-dialog-title >{{data.head}}</h1>
    <div mat-dialog-content>
      <p>{{data.query}}</p>
      <p>{{data.warning}}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-raised-button color="warn" [mat-dialog-close]="1" style="flex-grow: 1;" cdkFocusInitial>{{t('menu.dialogs.yes')}}</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="0" style="flex-grow: 1;">{{t('menu.dialogs.no')}}</button>
    </div>
    </div>`,
  })
  
  
  export class ConfirmDialog  {
// в этот диалог надо заинжектить параметры head, query и warning, например:
// data:{head:'Удаление', query:'Удалить выбранные позиции?', warning:'Все связанные с этим параметром документы тоже будут удалены'}

    constructor(
      public dialogRef: MatDialogRef<ConfirmDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any) {}
    onNoClick(): void {
      this.dialogRef.close();
    }



  }
  
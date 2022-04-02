import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , OnInit, Inject} from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

@Component({
    selector: 'deletedialog',
    template:` 
    <div style="text-align:  center;">
        <h1 mat-dialog-title >{{data.head}}</h1>
            <p>{{data.warning}}</p>
        <form [formGroup]="formBaseInformation">
            
            <mat-divider></mat-divider>

            <div class="flex">
                <div style="width:50%; display:flex">
                    <p style="margin: auto;">Количество копий:</p>
                </div>
                <div style="width:50%">
                    <mat-form-field style="width:100%">
                        <mat-select formControlName="id1">
                            <mat-option [value]="1">1 копия</mat-option>
                            <mat-option [value]="2">2 копии</mat-option>
                            <mat-option [value]="3">3 копии</mat-option>
                            <mat-option [value]="4">4 копии</mat-option>
                            <mat-option [value]="5">5 копий</mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>
            </div>

            <mat-divider></mat-divider>

            <div class="flex">
                <div style="width:50%; display:flex">
                    <p style="margin: auto;">Артикул:</p>
                </div>
                <div style="width:50%"> 
                    <mat-radio-group
                        formControlName="id2"
                        class="e-radio-group">
                        <mat-radio-button class="e-radio-button" [value]="1">Копировать</mat-radio-button>
                        <mat-radio-button class="e-radio-button" [value]="2">Не копировать</mat-radio-button>
                    </mat-radio-group>
                </div> 
            </div>     

            <mat-divider></mat-divider>

            <div class="flex">
                <div style="width:50%; display:flex"> 
                    <p style="margin: auto;">Код:</p>
                </div>      
                <div style="width:50%">     
                    <mat-radio-group
                        formControlName="id3"
                        class="e-radio-group">
                        <mat-radio-button class="e-radio-button" [value]="1">Присвоить новый</mat-radio-button>
                        <mat-radio-button class="e-radio-button" [value]="2">Как в оригинале</mat-radio-button>
                        <mat-radio-button class="e-radio-button" [value]="3">Оставить пустым</mat-radio-button>
                    </mat-radio-group>
                </div>
            </div>

            <mat-divider></mat-divider>

            <div class="flex">
                <div style="width:50%; display:flex"> 
                    <p style="margin: auto;">Штрих-коды:</p>
                </div>      
                <div style="width:50%">     
                    <mat-radio-group
                        formControlName="id4"
                        class="e-radio-group">
                        <mat-radio-button class="e-radio-button" [value]="1">Не копировать</mat-radio-button>
                        <mat-radio-button class="e-radio-button" [value]="2">Копировать</mat-radio-button>
                    </mat-radio-group>
                </div>
            </div>
            <div class="flex" style="width:100%;"
            *ngIf="+formBaseInformation.get('id4').value==2 && +formBaseInformation.get('id3').value!=2">
                <p style="margin: auto;">Внимание! Если у дублируемого оригинала есть внутренние штрих-коды, основанные на поле «Код», в дубликатах они станут неактуальны, т.к. значение поля «Код» у них будет другим.</p>
            </div>
        </form>
        <div mat-dialog-actions>
            <button mat-raised-button color="warn" (click)="goToDoDuplicates()" style="flex-grow: 1;" cdkFocusInitial>Начать</button>
            <button mat-raised-button color="primary" (click)="onNoClick()" style="flex-grow: 1;">Отмена</button>
        </div>
    </div>`,
    styles: [` 
    .e-radio-group {
        display: flex;
        flex-direction: column;
        margin: 15px 0;
    } 
    .flex{ display: flex; }
    .e-radio-button {
        margin: 5px;
    }
      
    `]
  })
  
  
  export class ProductDuplicateDialog  implements OnInit {
// в этот диалог надо заинжектить параметры head, query и warning, например:
// data:{head:'Удаление', warning:'Все связанные с этим параметром документы тоже будут удалены'}

formBaseInformation:any;//форма для основной информации, содержащейся в документе

    constructor(
        private _snackBar: MatSnackBar,
        private http:HttpClient, 
        public MessageDialog: MatDialog,
        public dialogRef: MatDialogRef<ProductDuplicateDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
      
    onNoClick(): void {
        this.dialogRef.close();
    }
    
    ngOnInit() {

    console.log("productId:"+this.data.productId);
    
    this.formBaseInformation = new FormGroup({
        id:  new FormControl(this.data.productId,[]), // id товара
        id1: new FormControl(1,[]), // количество копий
        id2: new FormControl(1,[]), // артикул: 1-копировать, 2-не копировать
        id3: new FormControl(1,[]), // код: 1-оставить пустым, 2-как в оригинале, 3-присвоить новый
        id4: new FormControl(1,[]), // штрих-код: 1-оставить пустым, 2-как в оригинале
        // cagentAdditional: new FormControl(this.data.cagentAdditional,[]),// примечание (дополнительная информация)
        // docName: new FormControl(this.data.docName,[]),// 
    });
    }



    goToDoDuplicates(){
        const body = {  "id" :+this.data.productId,
                        "id1":+this.formBaseInformation.get('id1').value,
                        "id2":+this.formBaseInformation.get('id2').value,
                        "id3":+this.formBaseInformation.get('id3').value,
                        "id4":+this.formBaseInformation.get('id4').value}
        return this.http.post('/api/auth/copyProducts', body)
                .subscribe(
                    (data) => {   
                              this.openSnackBar("Документ дублирован", "Закрыть");
                              this.dialogRef.close(1);

                            },
                    error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
                );
      }
    

      openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
          duration: 3000,
        });
      } 


  }
  
import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

interface categoriesOrderResponse {
  id: number;
  output_order: string;
  }

@Component({
  selector: 'app-universal-categories-dialog',
  templateUrl: './universal-categories-dialog.component.html',
  styleUrls: ['./universal-categories-dialog.component.css']
})
export class UniversalCategoriesDialogComponent implements OnInit {
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  receivedSetsOfCategories: any [] = [] ;//массив для получения сетов категорий для изменения их порядка вывода
  orderCategories: categoriesOrderResponse[] = [];// массив для отправки очередности категорий [{id категории,order},{id категории,order},...]
  url: string; 

  constructor(
    public dialogRef: MatDialogRef<UniversalCategoriesDialogComponent>,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    public MessageDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    console.log("data.actionType:"+this.data.actionType);
    console.log("data.parentCategoryName:"+this.data.parentCategoryName);
    console.log("data.parentCategoryId:"+this.data.parentCategoryId);
    console.log("data.docName:"+this.data.docName);

    this.formBaseInformation = new UntypedFormGroup({
      parentCategoryId: new UntypedFormControl(+this.data.parentCategoryId,[]),//id РОДИТЕЛЬСКОЙ категории для создаваемой категории (ПУСТО - КОРНЕВАЯ БУДЕТ)
                                                                        //или для изменения порядка дочерних категорий
      categoryId: new UntypedFormControl(+this.data.categoryId,[]),//id созданной, редактируемой или удаляемой категории
      name: new UntypedFormControl            (this.data.categoryName,[Validators.required]),
      companyId: new UntypedFormControl(+this.data.companyId,[]),//id выбранного предприятия
    });

    if(this.data.actionType=='changeOrder'){
      if(this.data.parentCategoryId==0){this.url="/api/auth/getRoot"+this.data.docName+"Categories"} else {this.url="/api/auth/getChildrens"+this.data.docName+"Categories"}
      return this.http.post(this.url, this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                          this.receivedSetsOfCategories=data as any [];
                          console.log("receivedSetsOfCategories: "+this.receivedSetsOfCategories);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
    }
  }
  

  clickBtnCreateCategory(){// Нажатие кнопки Создать
    this.createCategory();
  }

  updateCategory(){
    return this.http.post('/api/auth/update'+this.data.docName+'Category', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                  this.openSnackBar(translate('modules.msg.cat_saved'), translate('modules.button.close'));
                          this.dialogRef.close();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  createCategory(){
    return this.http.post('/api/auth/insert'+this.data.docName+'Category', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;
                  this.openSnackBar(translate('modules.msg.cat_created'), translate('modules.button.close'));
                  this.dialogRef.close(this.data.categoryId);
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

//*****************************************************************************************************************************************/
//*******************************************   D R A G   A N D   D R O P   ***************************************************************/
//*****************************************************************************************************************************************/

  dropSet(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.receivedSetsOfCategories, event.previousIndex, event.currentIndex);
  }

  saveChangeCategoriesOrder(){
    let order:number=1;
    this.orderCategories=[];

    this.receivedSetsOfCategories.forEach(set => //для каждого сета полей
    {
      set.output_order=order;
      this.orderCategories.push(set);
      order++;
    });

    return this.http.post('/api/auth/saveChange'+this.data.docName+'CategoriesOrder', this.orderCategories)
            .subscribe(
                (data) => {   
                            this.openSnackBar(translate('modules.msg.ord_cat_saved'), translate('modules.button.close'));
                            this.dialogRef.close();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }
}

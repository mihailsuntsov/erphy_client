import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, FormGroup, FormControl} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface categoriesOrderResponse {//интерфейс для получения ответа в методе getFields (информации по полям)
  id: number;
  output_order: string;
  }

@Component({
  selector: 'app-product-categories-dialog',
  templateUrl: './product-categories-dialog.component.html',
  styleUrls: ['./product-categories-dialog.component.css']
})
export class ProductCategoriesDialogComponent implements OnInit {

  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  createdDockId: number;//массив для получение id созданного объекта
  receivedSetsOfCategories: any [] = [] ;//массив для получения сетов категорий для изменения их порядка вывода
  orderCategories: categoriesOrderResponse[] = [];// массив для отправки очередности категорий [{id категории,order},{id категории,order},...]
  url: string; 

  constructor(
    public dialogRef: MatDialogRef<ProductCategoriesDialogComponent>,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any) {}
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    // console.log("data.actionType:"+this.data.actionType);
    // console.log("data.parentCategoryName:"+this.data.parentCategoryName);
    // console.log("data.parentCategoryId:"+this.data.parentCategoryId);
    // console.log("data.dockName:"+this.data.dockName);

    this.formBaseInformation = new FormGroup({
      parentCategoryId: new FormControl(+this.data.parentCategoryId,[]),//id РОДИТЕЛЬСКОЙ категории для создаваемой категории (ПУСТО - КОРНЕВАЯ БУДЕТ)
                                                                        //или для изменения порядка дочерних категорий
      categoryId: new FormControl(+this.data.categoryId,[]),//id созданной, редактируемой или удаляемой категории
      name: new FormControl            (this.data.categoryName,[Validators.required]),
      companyId: new FormControl(+this.data.companyId,[]),//id выбранного предприятия
    });

    if(this.data.actionType=='changeOrder'){
      if(this.data.parentCategoryId==0){this.url="/api/auth/getRootProductCategories"} else {this.url="/api/auth/getChildrensProductCategories"}
      return this.http.post(this.url, this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                          this.receivedSetsOfCategories=data as any [];
                          console.log("receivedSetsOfCategories: "+this.receivedSetsOfCategories);
                        },
                error => console.log(error),
            );
    }
  }
  

  clickBtnCreateProductCategory(){// Нажатие кнопки Создать
    this.createProductCategory();
  }

  updateProductCategory(){
    return this.http.post('/api/auth/updateProductCategory', this.formBaseInformation.value)
            .subscribe(
                (data) => {   
                          this.openSnackBar("Категория сохранена", "Закрыть");
                          this.dialogRef.close();
                        },
                error => console.log(error),
            );
  }

  createProductCategory(){
    return this.http.post('/api/auth/insertProductCategory', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;
                  this.openSnackBar("Категория создана", "Закрыть");
                  this.dialogRef.close(this.data.categoryId);
                },
        error => console.log(error),
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

    return this.http.post('/api/auth/saveChangeCategoriesOrder', this.orderCategories)
            .subscribe(
                (data) => {   
                            this.openSnackBar("Порядок категорий успешно сохранён", "Закрыть");
                            this.dialogRef.close();
                        },
                error => console.log(error),
            );
  }
}

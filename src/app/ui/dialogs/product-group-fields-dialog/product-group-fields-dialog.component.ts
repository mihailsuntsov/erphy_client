// import { Component, OnInit , Inject} from '@angular/core';
// import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
// import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
// import { HttpClient} from '@angular/common/http';
// import { MatSnackBar} from '@angular/material/snack-bar';
// import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
// import { MatDialog } from '@angular/material/dialog';
// import { translate } from '@ngneat/transloco'; //+++

// @Component({
//   selector: 'app-product-group-fields-dialog',
//   templateUrl: './product-group-fields-dialog.component.html',
//   styleUrls: ['./product-group-fields-dialog.component.css']
// })
// export class ProductGroupFieldsDialogComponent implements OnInit {

//   //Формы
//   formBaseInformation:any;//форма для основной информации, содержащейся в документе
//   createdDocId: string[];//массив для получение id созданного документа
//   //updateDocumentResponse: string;//массив для получения данных

//   constructor(
//     public dialogRef: MatDialogRef<ProductGroupFieldsDialogComponent>,
//     private _snackBar: MatSnackBar,
//     public MessageDialog: MatDialog,
//     private http: HttpClient,
//     @Inject(MAT_DIALOG_DATA) public data: any) {}
//   onNoClick(): void {
//     this.dialogRef.close();
//   }

//   ngOnInit() {
//     console.log("data.group_id:"+this.data.group_id);
//     console.log("data.company_id:"+this.data.company_id);
//     console.log("data.sets:"+this.data.sets);

//     this.formBaseInformation = new UntypedFormGroup({
//       id: new UntypedFormControl      (this.data.id,[]),                 //id поля
//       company_id: new UntypedFormControl      (this.data.company_id,[]), //предприятие
//       field_type: new UntypedFormControl      (this.data.field_type,[]), //(тип: 2 - поле, 1 - сет полей)
//       group_id: new UntypedFormControl        (this.data.group_id,[]),//id группы товаров (документа, содержащего поля)
//       parent_set_id: new UntypedFormControl   (this.data.parent_set_id,[Validators.required]),//выбранная группа полей (сет полей) в качестве родительской для поля
//       name: new UntypedFormControl            (this.data.name,[Validators.required]),
//       description: new UntypedFormControl     (this.data.description,[]),
//     });

//     if(this.data.field_type==1){//не валидировать parent_set_id если тип - сет полей (тогда выпадающего списка с родительским сетом вообще не будет)
//       this.formBaseInformation.controls.parent_set_id.disable();
//     }

//   }

//   clickBtnUpdateField(){// Нажатие кнопки Сохранить
//     this.updateField();
//   }
//   clickBtnCreateNewField(){// Нажатие кнопки Создать
//     this.createField();
//   }
//   updateField(){
//     return this.http.post('/api/auth/updateProductGroupField', this.formBaseInformation.value)
//             .subscribe(
//                 (data) => {   
//                             if(this.data.field_type==2){this.openSnackBar("Поле сохранено", "Закрыть");
//                           }else this.openSnackBar("Группа полей сохранена", "Закрыть");
//                           this.dialogRef.close();
//                         },
//                 error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
//             );
            
//   }
//   createField(){
//     return this.http.post('/api/auth/insertProductGroupField', this.formBaseInformation.value)
//     .subscribe(
//         (data) => {   
//                     if(this.data.field_type==2){this.openSnackBar("Поле создано", "Закрыть");
//                   }else this.openSnackBar("Группа полей создана", "Закрыть");
//                   this.dialogRef.close();
//                 },
//         error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
//     );
//   }











//   openSnackBar(message: string, action: string) {
//     this._snackBar.open(message, action, {
//       duration: 3000,
//     });
//   }
  

// }

import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { SlugifyPipe } from 'src/app/services/slugify.pipe';

interface ProductAttributeTerm{
  id: number;
  name: string;
  description: string;
  slug: string;
}

@Component({
  selector: 'app-product-attribute-terms',
  templateUrl: './product-attribute-terms.component.html',
  styleUrls: ['./product-attribute-terms.component.css'],
  providers: [SlugifyPipe]
})
export class ProductAttributeTermsComponent implements OnInit {

  actionType: string;
  formBaseInformation:any;

  constructor(
    public  productAttributeTermsDialog: MatDialogRef<ProductAttributeTermsComponent>,
    private _snackBar: MatSnackBar,
    public  MessageDialog: MatDialog,
    private slugifyPipe: SlugifyPipe,
    public  ConfirmDialog: MatDialog,
    public  ProductDuplicateDialog: MatDialog,
    private http: HttpClient,
    public  deleteDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
  ngOnInit() {
    this.actionType = this.data.actionType;
    this.formBaseInformation = new UntypedFormGroup({
      id:           new UntypedFormControl(+this.data.termId,[]),
      name:         new UntypedFormControl(this.data.termName,[Validators.required,Validators.maxLength(120)]),
      slug:         new UntypedFormControl(this.data.termSlug,[Validators.required, Validators.maxLength(120)]),
      description:  new UntypedFormControl(this.data.termDescription,[Validators.maxLength(1000)]),
      companyId:    new UntypedFormControl(+this.data.companyId,[]),
      attribute_id: new UntypedFormControl(+this.data.attribute_id,[]),
      menu_order:   new UntypedFormControl(+this.data.menu_order,[]),
    }); 
  }
  
  insertProductAttributeTerm(){
    this.http.post('/api/auth/insertProductAttributeTerm', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    case -214:{//Неуникальное имя термина в пределах одного аттрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_name_uq')}});
                      break;
                    }
                    case -212:{//Неуникальный url-псевдоним (slug) термина в пределах одного предприятия
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_crtd_suc'), translate('modules.button.close'));
                      this.productAttributeTermsDialog.close(this.data.categoryId);
                    }
                  }
                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }

  updateProductAttributeTerm(){
    this.http.post('/api/auth/updateProductAttributeTerm', this.formBaseInformation.value)
    .subscribe(
        (data) => {   
                  this.data.categoryId=data as number;

                  switch(this.data.categoryId){
                    case null:{// null возвращает если не удалось создать документ из-за ошибки
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.crte_doc_err',{name:''})}});
                      break;
                    }
                    case -1:{//недостаточно прав
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat',{name:''})}});
                      break;
                    }
                    case -214:{//Неуникальное имя термина в пределах одного аттрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_name_uq')}});
                      break;
                    }
                    case -212:{//Неуникальный url-псевдоним (slug) термина в пределах одного предприятия
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('docs.msg.doc_sved_suc'), translate('modules.button.close'));
                      this.productAttributeTermsDialog.close(this.data.categoryId);
                    }
                  }
                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }
  
  onNoClick(): void {
    this.productAttributeTermsDialog.close();
  }


  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  slugify(){
    this.formBaseInformation.get('slug').setValue(
      this.slugifyPipe.transform(this.formBaseInformation.get('name').value)
    );
  }

} 
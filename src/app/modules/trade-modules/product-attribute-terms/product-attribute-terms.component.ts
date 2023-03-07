import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { UntypedFormControl, UntypedFormGroup, Validators, UntypedFormArray, UntypedFormBuilder} from '@angular/forms';
import { SlugifyPipe } from 'src/app/services/slugify.pipe';

interface StoreTermTranslation{
  description: string;
  name: string;
  slug: string;
  langCode: string ;
}

interface IdAndName{ //универсалный интерфейс для выбора из справочников
  id: any;
  name: string;
}

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

  // Store Translations variables
  storeDefaultLanguage: string = ''; // default language from Company settings ( like EN )
  storeLanguagesList: string[] = [];  // the array of languages from all stores like ["EN","RU", ...]
  storeTermTranslations: StoreTermTranslation[]=[]; // the list of translated categories data
  storeTranslationModeOn = false; // translation mode ON

  constructor(
    public  productAttributeTermsDialog: MatDialogRef<ProductAttributeTermsComponent>,
    private _snackBar: MatSnackBar,
    public  MessageDialog: MatDialog,
    private slugifyPipe: SlugifyPipe,
    public  ConfirmDialog: MatDialog,
    public  ProductDuplicateDialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private http: HttpClient,
    public  deleteDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
  ngOnInit() {
    this.actionType = this.data.actionType;

    this.storeDefaultLanguage = this.data.storeDefaultLanguage;
    this.storeLanguagesList = this.data.storeLanguagesList;
    this.storeTermTranslations = this.data.storeTermTranslations;

    this.formBaseInformation = new UntypedFormGroup({
      id:           new UntypedFormControl(+this.data.termId,[]),
      name:         new UntypedFormControl(this.data.termName,[Validators.required,Validators.maxLength(120)]),
      slug:         new UntypedFormControl(this.data.termSlug,[Validators.maxLength(120)]),
      description:  new UntypedFormControl(this.data.termDescription,[Validators.maxLength(1000)]),
      companyId:    new UntypedFormControl(+this.data.companyId,[]),
      attribute_id: new UntypedFormControl(+this.data.attribute_id,[]),
      menu_order:   new UntypedFormControl(+this.data.menu_order,[]),
      storeTermTranslations: new UntypedFormArray ([]) ,
    }); 

    this.fillStoreTermTranslationsArray();
  }
  
// ----------------------+----------------------  Store Translations start  ----------------------+---------------------

  fillStoreTermTranslationsArray(){
    console.log(this.storeLanguagesList.length);
    console.log(this.storeDefaultLanguage);
    console.log(this.storeTermTranslations.length);

    const add = this.formBaseInformation.get('storeTermTranslations') as UntypedFormArray;
    add.clear();
    this.storeLanguagesList.forEach(langCode =>{
      if(langCode!=this.storeDefaultLanguage)
        add.push(this._fb.group(this.getTermTranslation(langCode)));
    });
    //  alert(this.formBaseInformation.get('storeTermTranslations').value.length);
  }
  
  getTermTranslation(currLangCode:string):StoreTermTranslation {
    // if thre is the translation for current language in DB - return this translation, else - return empty translation
    let result:StoreTermTranslation = {
      description:  '', 
      name:         '', 
      slug:         '',
      langCode:     currLangCode
    }
    this.storeTermTranslations.forEach(translation =>{
      if(currLangCode==translation.langCode)
        result = {
          description: translation.description, 
          name: translation.name, 
          slug: translation.slug, 
          langCode: currLangCode
        }
    });
    return result;
  }
  
  changeTranslationMode(){if(this.storeTranslationModeOn) this.storeTranslationModeOn=false; else this.storeTranslationModeOn=true;}
// ----------------------+----------------------  Store Translations end  ----------------------+---------------------


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
                    case -215:{//Неуникальное имя терма в пределах одного аттрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_name_uq')}});
                      break;
                    }
                    case -217:{//Неуникальный url-псевдоним (slug) терма в пределах одного атрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
                      break;
                    }
                    case -216:{//Неуникальное имя терма в пределах одного аттрибута в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.term_tr_name_uq')}});
                      break;
                    }
                    case -218:{//Неуникальный url-псевдоним (slug) терма в пределах одного аттрибута в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.term_tr_slug_uq')}});
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
                    case -215:{//Неуникальное имя терма в пределах одного аттрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_name_uq')}});
                      break;
                    }
                    case -217:{//Неуникальный url-псевдоним (slug) терма в пределах одного аттрибута
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
                      break;
                    }
                    case -216:{//Неуникальное имя терма в пределах одного аттрибута в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.term_tr_name_uq')}});
                      break;
                    }
                    case -218:{//Неуникальный url-псевдоним (slug) терма в пределах одного аттрибута в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.term_tr_slug_uq')}});
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
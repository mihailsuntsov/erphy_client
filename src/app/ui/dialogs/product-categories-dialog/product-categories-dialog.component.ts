import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl, UntypedFormArray, UntypedFormBuilder} from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { translate, TranslocoService } from '@ngneat/transloco'; //+++
import { FilesComponent } from '../../pages/documents/files/files.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { ShowImageDialog } from 'src/app/ui/dialogs/show-image-dialog.component';
import { FilesDocComponent } from 'src/app/ui/pages/documents/files-doc/files-doc.component';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ViewChild } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SlugifyPipe } from 'src/app/services/slugify.pipe';

interface categoriesOrderResponse {//интерфейс для получения ответа в методе getFields (информации по полям)
  id: number;
  output_order: string;
  }
interface Image{
    description: string;
    extention: string;
    file_size: number;
    id: number;
    mime_type: string;
    name: string;
    original_name: string;
    path: string;
    alt: string;
    anonyme_access:boolean;
  }

  interface ProductCategory{
    description: string;
    display: string;
    id: number;
    image: Image;
    name: string;
    slug: string;
    parentCategoryId: number;
    companyId: number;
    isStoreCategory: boolean;
    isBookingCategory: boolean;
    storesIds: number[]
  }

  interface ProductCategoriesTreeNode {
    id: string;
    name: string;
    children?: ProductCategoriesTreeNode[];
  }

  interface ProductCategoriesFlatNode {
    expandable: boolean;
    name: string;
    level: number;
  }
  
  interface StoreCategoryTranslation{
    description: string;
    name: string;
    slug: string;
    langCode: string ;
  }
  interface IdAndName {
    id: number;
    name:string;
  }
@Component({
  selector: 'app-product-categories-dialog',
  templateUrl: './product-categories-dialog.component.html',
  styleUrls: ['./product-categories-dialog.component.css'],
  providers: [SlugifyPipe]
})
export class ProductCategoriesDialogComponent implements OnInit {
  // @ViewChild('auto', { read: MatAutocompleteTrigger }) auto: MatAutocompleteTrigger;
  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;
  formBaseInformation:any;//форма для основной информации, содержащейся в документе
  createdDocId: number;//массив для получение id созданного объекта
  receivedSetsOfCategories: any [] = [] ;//массив для получения сетов категорий для изменения их порядка вывода
  orderCategories: categoriesOrderResponse[] = [];// массив для отправки очередности категорий [{id категории,order},{id категории,order},...]
  url: string; 
  imageToShow:any; // переменная в которую будет подгружаться картинка файла (если он jpg или png)
  productCategory: ProductCategory={
    description: '',
    display: 'default',
    id: null,
    image: null,
    name: '',
    slug: '',
    companyId: null,
    parentCategoryId: 0,
    isStoreCategory: false,
    isBookingCategory: false,
    storesIds: []
  };
  noImageAddress: string="../../../../../../assets_/images/no_foto.jpg"; // заглушка для главной картинки товара
  parentAndChildsIds: number[]=[];
  //Categories tree   
  private _transformer = (node: ProductCategoriesTreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      id: node.id,
      level: level,
    };
  }
  treeControl = new FlatTreeControl<ProductCategoriesFlatNode>(node => node.level, node => node.expandable);
  treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  treeDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: ProductCategoriesFlatNode) => node.expandable;
  numRootCategories: number=0;
  numChildsOfSelectedCategory: number=0;

  // Store Translations variables
  storeDefaultLanguage: string = ''; // default language from Company settings ( like EN )
  storeLanguagesList: string[] = [];  // the array of languages from all stores like ["EN","RU", ...]
  storeCategoryTranslations: StoreCategoryTranslation[]=[]; // the list of translated categories data
  storeTranslationModeOn = false; // translation mode ON
  // Category-Stores variables
  receivedStoresList:IdAndName[]=[];//an array to get a list of online stores

  constructor(
    public dialogRef: MatDialogRef<ProductCategoriesDialogComponent>,
    private _snackBar: MatSnackBar,
    public MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private _fb: UntypedFormBuilder,
    public dialogAddFiles: MatDialog,
    public service:TranslocoService,
    private http: HttpClient,
    private slugifyPipe: SlugifyPipe,
    public ShowImageDialog: MatDialog,  
    @Inject(MAT_DIALOG_DATA) public data: any) {}
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    // console.log("data.actionType:"+this.data.actionType);
    // console.log("data.parentCategoryName:"+this.data.parentCategoryName);
    // console.log("data.parentCategoryId:"+this.data.parentCategoryId);
    // console.log("data.docName:"+this.data.docName);

    this.productCategory.companyId=this.data.companyId;

    this.formBaseInformation = new UntypedFormGroup({
      parentCategoryId: new UntypedFormControl(0,[]),//id РОДИТЕЛЬСКОЙ категории для создаваемой категории (0 - КОРНЕВАЯ БУДЕТ)
                                                                        //или для изменения порядка дочерних категорий
      // categoryId: new UntypedFormControl(+this.data.categoryId,[]),//id созданной, редактируемой или удаляемой категории
      companyId: new UntypedFormControl     (+this.data.companyId,[]),//id выбранного предприятия
      id: new UntypedFormControl            (+this.data.categoryId,[]),
      name: new UntypedFormControl          ('',[Validators.required]),
      description: new UntypedFormControl   ('',[Validators.maxLength(250)]),
      slug: new UntypedFormControl          ('',[Validators.maxLength(120)]),
      display: new UntypedFormControl       ('default',[]),
      isStoreCategory:new UntypedFormControl(false,[]),
      isBookingCategory:new UntypedFormControl(false,[]),
      parent_catgr: new UntypedFormControl  (translate('modules.list.none'),[]),
      storeCategoryTranslations: new UntypedFormArray ([]) ,
      storesIds: new UntypedFormControl     ([],[]),
    });
    if(this.data.actionType=='changeOrder'){
      if(this.data.parentCategoryId==0)
      {this.url="/api/auth/getRootProductCategories?companyId="+this.data.companyId} 
      else {this.url="/api/auth/getChildrensProductCategories?parentCategoryId="+this.data.parentCategoryId}
      // return this.http.post(this.url, this.formBaseInformation.value)
      this.http.get(this.url)
            .subscribe(
                (data) => {   
                          this.receivedSetsOfCategories=data as any [];
                          console.log("receivedSetsOfCategories: "+this.receivedSetsOfCategories);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
    }

    if(this.data.categoryId !== undefined) this.getProductCategory(); // in a case of category edition 
    if(this.data.actionType=='create') {
      this.getProductCategoriesTrees(this.data.companyId);
      this.getStoresLanguagesList();
      this.getStoresList();
    }
  }
  
  getProductCategory(){
    this.http.get('/api/auth/getProductCategory?id='+this.data.categoryId)
            .subscribe(
                (data) => {   
                            this.productCategory=data as ProductCategory;
                            this.formBaseInformation.get('description').setValue(this.productCategory.description);
                            this.formBaseInformation.get('display').setValue(this.productCategory.display);
                            this.formBaseInformation.get('slug').setValue(this.productCategory.slug);
                            this.formBaseInformation.get('name').setValue(this.productCategory.name);
                            this.formBaseInformation.get('parentCategoryId').setValue(this.productCategory.parentCategoryId);
                            this.formBaseInformation.get('isStoreCategory').setValue(this.productCategory.isStoreCategory);
                            this.formBaseInformation.get('isBookingCategory').setValue(this.productCategory.isBookingCategory);
                            this.formBaseInformation.get('storesIds').setValue(this.productCategory.storesIds);
                            if(this.productCategory.image) 
                              this.loadFileImage();
                            this.getProductCategoriesTrees(this.data.companyId);
                            this.getStoresLanguagesList();
                            this.getStoresList();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            );
  }


  // ----------------------+----------------------  Store Translations start ----------------------+----------------------  
  getStoresLanguagesList(){
    this.http.get('/api/auth/getStoresLanguagesList?company_id='+this.data.companyId).subscribe(
        (data) => {   
                    this.storeLanguagesList = data as any[];
                    this.getStoreDefaultLanguageOfCompany();
                  },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  getStoreDefaultLanguageOfCompany(){
    this.http.get('/api/auth/getStoreDefaultLanguageOfCompany?company_id='+this.data.companyId).subscribe(
        (data) => {   
                    this.storeDefaultLanguage = data as string;
                    if(+this.data.categoryId>0) this.getStoreCategoryTranslationsList(); else this.fillStoreCategoryTranslationsArray();
                  },  
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  getStoreCategoryTranslationsList(){
    this.http.get('/api/auth/getStoreCategoryTranslationsList?category_id='+this.data.categoryId).subscribe(
        (data) => {   
                    this.storeCategoryTranslations = data as StoreCategoryTranslation[];
                    this.fillStoreCategoryTranslationsArray();
                  },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  fillStoreCategoryTranslationsArray(){
    const add = this.formBaseInformation.get('storeCategoryTranslations') as UntypedFormArray;
    add.clear();
    this.storeLanguagesList.forEach(langCode =>{
      if(langCode!=this.storeDefaultLanguage)
        add.push(this._fb.group(this.getCategoryTranslation(langCode)));
    });
    // alert(this.formBaseInformation.get('storeCategoryTranslations').value.length)
  }

  getCategoryTranslation(currLangCode:string):StoreCategoryTranslation {
    let result:StoreCategoryTranslation = {
      description:  '', 
      name:         '', 
      slug:         '',
      langCode:     currLangCode
    }
    this.storeCategoryTranslations.forEach(translation =>{
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
// ----------------------+----------------------  Store Translations end ----------------------+---------------------- 
// ----------------------+----------------------  Category-Stores start -----------------------+---------------------- 
getStoresList(){
  this.http.get('/api/auth/getStoresList?company_id='+this.data.companyId).subscribe(
      (data) => {this.receivedStoresList = data as IdAndName[];},
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
  );
}
// ----------------------+----------------------  Category-Stores end -------------------------+---------------------- 


  clickBtnCreateProductCategory(){// Нажатие кнопки Создать
    this.createProductCategory();
  }

  updateProductCategory(){
    return this.http.post('/api/auth/updateProductCategory', this.formBaseInformation.value).subscribe(
        (data) => {   
          this.data.categoryId=data as number;
          switch(this.data.categoryId){
            case null:{// null возвращает если не удалось создать документ из-за ошибки
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.error_msg')}});
              break;
            }
            case -1:{//недостаточно прав
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
              break;
            }
            case -210:{//Неуникальное имя Категории товаров в пределах одного родителя
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_name_uq')}});
              break;
            }
            case -207:{//Неуникальный url-псевдоним (slug) Категории товаров в пределах одного родителя
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
              break;
            }
            case -209:{//Неуникальное имя Категории товаров в пределах одного родителя в одном из переводов
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_tr_name_uq')}});
              break;
            }
            case -208:{//Неуникальный url-псевдоним Категории товаров в пределах одного родителя в одном из переводов
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_tr_slug_uq')}});
              break;
            }
            default:{// Документ успешно создался в БД 
              this.openSnackBar(translate('modules.msg.cat_saved'), translate('modules.button.close'));
                    this.dialogRef.close(1);
            }
          }
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
      );
  }

  createProductCategory(){
    return this.http.post('/api/auth/insertProductCategory', this.formBaseInformation.value)
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
                    case -210:{//Неуникальное имя Категории товаров в пределах одного родителя
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_name_uq')}});
                      break;
                    }
                    case -207:{//Неуникальный url-псевдоним (slug) Категории товаров в пределах одного родителя
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_slug_uq')}});
                      break;
                    }
                    case -209:{//Неуникальное имя Категории товаров в пределах одного родителя в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_tr_name_uq')}});
                      break;
                    }
                    case -208:{//Неуникальный url-псевдоним Категории товаров в пределах одного родителя в одном из переводов
                      this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.pc_cat_tr_slug_uq')}});
                      break;
                    }
                    default:{// Документ успешно создался в БД 
                      this.openSnackBar(translate('modules.msg.cat_created'), translate('modules.button.close'));
                      this.dialogRef.close(this.data.categoryId);
                    }
                  }                 
                },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'), message:error.error}});},
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  onChangeStoreCategory(){
    // console.log(this.formBaseInformation.get('isStoreCategory').value)
    // if(this.formBaseInformation.get('isStoreCategory').value && this.formBaseInformation.get('slug').value == '')
    //   this.slugify();
    if (!this.formBaseInformation.get('isStoreCategory').value)
      this.formBaseInformation.get('slug').setValue('');
  }

  // !!! now the auto-slugify is off, because is there isn't in WooCommerce !!!
  // WooCommerce has autoslug, if slug field is empty. Also, if CRMm user wants to cpecify the slug, he can do it manually
  slugify(){
    this.formBaseInformation.get('slug').setValue(
      this.slugifyPipe.transform(this.formBaseInformation.get('name').value)
    );
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
                        this.openSnackBar(translate('modules.msg.ord_cat_saved'), translate('modules.button.close'));
                        this.dialogRef.close();
                    },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
        );
    }

  //*****************************************************************************************************************************************/
  //******************************************              F I L E S             ***********************************************************/
  //*****************************************************************************************************************************************/

  loadFileImage(){
    if(this.productCategory.image.extention.toUpperCase() == '.PNG' || 
      this.productCategory.image.extention.toUpperCase() == '.JPG' || 
      this.productCategory.image.extention.toUpperCase() == '.JPEG'){
        this.getImage('/api/auth/getFileImageThumb/'+this.productCategory.image.name).subscribe(blob => {
          this.createImageFromBlob(blob);
        });
      }
  }

  getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, {responseType: 'blob'});
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.imageToShow = reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }
  addFileInField() {
    const dialogRef = this.dialogAddFiles.open(FilesComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'select',
        companyId: this.data.companyId
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result){
        return this.http.get('/api/auth/getImageFileInfo?id='+result[0])
        .subscribe(
          (data) => {   
            this.productCategory.image = data as Image;
            if(this.productCategory.image) this.loadFileImage();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
        );
      };
    });
  }
  deleteFileInField() {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.file_del_head'),
        query: translate('docs.msg.file_del_qury'),
        warning: translate('docs.msg.file_del_warn'),
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        this.productCategory.image=null;          
      }
    });
  }
  
  showImage(){
    const dialogRef = this.ShowImageDialog.open(ShowImageDialog, {
      data:
      { 
        link: this.productCategory.image.name,
      },
    });
  }
  openFileCard(docId:number) {
    const dialogRef = this.dialogAddFiles.open(FilesDocComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'window',
        docId: docId
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    //   if(result){
        return this.http.get('/api/auth/getImageFileInfo?id='+docId)
        .subscribe(
          (data) => {   
            this.productCategory.image = data as Image;
            if(this.productCategory.image) this.loadFileImage();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
        );
    //   };
    //     // this.getProductCategory();          
    });
  }
  //*****************************************************************************************************************************************/
  //******************************************              T R E E             *************************************************************/
  //*****************************************************************************************************************************************/
  //loading all product categories
  getProductCategoriesTrees(companyId: number){
    const body = {companyId: companyId};
    this.http.post('/api/auth/getProductCategoriesTrees', body)
    .subscribe(
        (data) => {   
          this.treeDataSource.data=data as any [];          
          // alert(this.data.actionType);  
          // alert(this.data.actionType=='create');  
          // if(this.productCategory && this.productCategory.parentCategoryId!=0){
          if(this.data.actionType=='update' && this.productCategory.parentCategoryId!=0) 
            this.formBaseInformation.get('parent_catgr').setValue(this.getNodeNameById(this.productCategory.parentCategoryId));
          if(this.data.actionType=='create'){
            // alert(this.data.parentCategoryName);    
            // alert(this.data.parentCategoryId);          
            this.formBaseInformation.get('parent_catgr').setValue(this.data.parentCategoryName?this.data.parentCategoryName:translate('modules.list.none'));
            this.formBaseInformation.get('parentCategoryId').setValue(this.data.parentCategoryId);
            this.productCategory.parentCategoryId=this.data.parentCategoryId;
          }              
          // }
            // now need to delete the selected category and all its children categories to exclude the possibility of choose it
            // as a new parent category and the loop exceptions
          if(this.productCategory.id) this.deleteNodesByParentId(this.productCategory.id);
            // this.deleteNodeById(this.productCategory.id);
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  selectNode(node: any){
    this.productCategory.parentCategoryId=node.id;
    this.autoComplete.closePanel();    
    this.formBaseInformation.get('parent_catgr').setValue(this.getNodeNameById(node.id));
    this.formBaseInformation.get('parentCategoryId').setValue(node.id);
  }

  selectNone(){
    this.productCategory.parentCategoryId=0;
    this.autoComplete.closePanel();
    this.formBaseInformation.get('parent_catgr').setValue(translate('modules.list.none'));
    this.formBaseInformation.get('parentCategoryId').setValue(0);
  }

  getSelectedItems(): string {
    if (!this.productCategory || !this.treeControl.dataNodes || this.productCategory.parentCategoryId == 0) 
      return translate('modules.list.none');
    return this.getNodeNameById(this.productCategory.parentCategoryId);
  }

  getNodeId(node: any):number{
    return(node.id);
  }  

  getNodeNameById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return this.treeControl.dataNodes[i].name;
      }
    }
  }


  getNodeById(id:number):any {
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.getNodeId(this.treeControl.dataNodes[i])==id){
        return this.treeControl.dataNodes[i];
      }
    }
  }

  deleteNodeById(id:number):void {
    this.treeDataSource.data=this.treeDataSource.data.filter((n) => this.getNodeId(n) !== id);
  }


  doNodeHide(nodeId:number){
    // console.log("this.parentAndChildsIds - "+this.parentAndChildsIds.toString());
    // console.log("nodeId - "+nodeId+", doNodeShow - " + this.parentAndChildsIds.includes(nodeId));
    return this.parentAndChildsIds.includes(nodeId);
  }

  deleteNodesByParentId(id:number) {
    this.http.get("/api/auth/getProductCategoryChildIds?id="+id)
    .subscribe(
      (data) => {   
        console.log("receivedProductCategoryChildIds: " + (data as number[]).toString());
        this.parentAndChildsIds =  data as number []; //get all childs
        this.parentAndChildsIds.push(id); // adding parent
        console.log("Before length: " + this.treeDataSource.data.length);
        // childIds.forEach(i => {
          // console.log(i);
          // this.deleteNodeById(i);
        // });
        
        console.log("After length: " + this.treeDataSource.data.length);
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  // removeItem(node: ProductCategoriesFlatNode) {
  //   let parentNode = this.flatNodeMap.get(node);
  //   let flatNode = this.dataSource.data[0].children;
  //   for (let i = flatNode.length - 1; i >= 0; i--) {
  //     if (flatNode[i].item === node.item) {

  //       if (parentNode.children) {
  //         //if you want to warn user
  //       }

  //       this.dataChange.value[0].children.splice(i, 1);
  //       this.flatNodeMap.delete(node);
  //       this.dataChange.next(this.data);
  //     }
  //   }
  // }

  getProductCategoryChildIds(parentId:number){
    this.http.get("/api/auth/getProductCategoryChildIds?id="+parentId)
            .subscribe(
                (data) => {   
                          console.log("receivedProductCategoryChildIds: " + (data as number[]).toString());
                          return data as number [];
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }


}

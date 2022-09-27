import { Component, OnInit , Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Validators, UntypedFormGroup, UntypedFormControl} from '@angular/forms';
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
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ViewChild } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SlugifyPipe } from './slugify.pipe';

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
    parentCategoryId: 0
  };
  noImageAddress: string="../../../../../../assets_/images/no_foto.jpg"; // заглушка для главной картинки товара

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


  constructor(
    public dialogRef: MatDialogRef<ProductCategoriesDialogComponent>,
    private _snackBar: MatSnackBar,
    public MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
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
      parent_catgr: new UntypedFormControl  (translate('modules.list.none'),[]),
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
                            if(this.productCategory.image) 
                              this.loadFileImage();
                            this.getProductCategoriesTrees(this.data.companyId);
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
            );
  }


  clickBtnCreateProductCategory(){// Нажатие кнопки Создать
    this.createProductCategory();
  }

  updateProductCategory(){
    this.productCategory.name = this.formBaseInformation.get('name').value;
    this.productCategory.description = this.formBaseInformation.get('description').value;
    this.productCategory.slug = this.formBaseInformation.get('slug').value;
    this.productCategory.display = this.formBaseInformation.get('display').value;
    // this.productCategory.parentCategoryId = this.formBaseInformation.get('parentCategoryId').value;    
    this.productCategory.display = this.formBaseInformation.get('display').value;
    return this.http.post('/api/auth/updateProductCategory', this.productCategory)
            .subscribe(
                (data) => {
                          this.openSnackBar(translate('modules.msg.cat_saved'), translate('modules.button.close'));
                          this.dialogRef.close();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
            );
  }

  createProductCategory(){
    this.productCategory.name = this.formBaseInformation.get('name').value;
    this.productCategory.description = this.formBaseInformation.get('description').value;
    this.productCategory.slug = this.formBaseInformation.get('slug').value;
    // this.productCategory.parentCategoryId = this.formBaseInformation.get('parentCategoryId').value;    
    this.productCategory.display = this.formBaseInformation.get('display').value;
    return this.http.post('/api/auth/insertProductCategory', this.productCategory)
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
        companyId: this.formBaseInformation.get('id').value
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
          if(this.productCategory.id) this.deleteNodesById(this.productCategory.id);
            this.deleteNodeById(this.productCategory.id);
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
    );
  }

  selectNode(node: any){
    this.productCategory.parentCategoryId=node.id;
    this.autoComplete.closePanel();
  }

  selectNone(){
    this.productCategory.parentCategoryId=0;
    this.autoComplete.closePanel();
    this.formBaseInformation.get('parent_catgr').setValue(translate('modules.list.none'));
  }

  getSelectedItems(): string {
    if (!this.productCategory || !this.treeControl.dataNodes || this.productCategory.parentCategoryId == 0) return translate('modules.list.none');
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


  deleteNodesById(id:number) {
    this.http.get("/api/auth/getProductCategoryChildIds?id="+id)
    .subscribe(
      (data) => {   
        console.log("receivedProductCategoryChildIds: " + (data as number[]).toString());
        var childIds =  data as number []; //get all childs
        childIds.push(id); // adding parent
        console.log("Before length: " + this.treeControl.dataNodes.length);
        childIds.forEach(i => {
          // console.log(i);
          this.deleteNodeById(i);
        });
        
        console.log("After length: " + this.treeControl.dataNodes.length);
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
    
  }
  
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

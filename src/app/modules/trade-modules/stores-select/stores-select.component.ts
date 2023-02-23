import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++

interface IdAndName {// интерфейс для выбранных объектов (магазины)
  id: number;
  name:string;
}

@Component({
  selector: 'app-stores-select',
  templateUrl: './stores-select.component.html',
  styleUrls: ['./stores-select.component.css'],
  providers: []
})

export class StoresSelectComponent implements OnInit {
  myCompanyId:number=0;//
  selectedObjects: IdAndName[] = []; // выбранные объекты (магазины)
  companyId: number; //предприятие, по которому будут отображаться товары и категории
  receivedObjectsList: IdAndName[] = []; // загруженные объекты (магазины)
  selectable = true;
  removable = true;
  storesLoading = false;

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToView:boolean = false;
  showNotEnoughPermissionsMessage:boolean = false;

  constructor(
    public storesSelectDialog: MatDialogRef<StoresSelectComponent>,
    private _snackBar: MatSnackBar,
    public storesDialog: MatDialog,
    public MessageDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any,) { 
    }
      
    ngOnInit() {
      this.companyId = this.data.companyId; //предприятие, по которому будут отображаться магазины
      this.getSetOfPermissions();
    }    

  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=54').subscribe(
      (data) => {   
                  this.permissionsSet=data as any [];
                  this.getMyCompanyId();
                },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
    );
  }

  getMyCompanyId(){
    this.http.get('/api/auth/getMyCompanyId').subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getCRUD_rights(this.permissionsSet);
      }, error => console.log(error));
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==676)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==677)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.companyId==this.myCompanyId);
    this.allowToView=((documentOfMyCompany && (this.allowToViewAllCompanies || this.allowToViewMyCompany))||(documentOfMyCompany==false && this.allowToViewAllCompanies))?true:false;
    this.showNotEnoughPermissionsMessage=true;//можно показывать сообщение о недостаточности прав на просмотр списка данных
    console.log("allowToView - "+this.allowToView);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.getObjectsList();
    }
  }

  getObjectsList(){
    this.storesLoading=true;
    this.http.get('/api/auth/getStoresList?company_id='+this.data.companyId).subscribe(
      (data) => {
        this.storesLoading=false;
        this.receivedObjectsList = data as IdAndName[];
      },
      error => {this.storesLoading=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
  );
  }

  onNoClick(): void {
    this.storesSelectDialog.close();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  //нажали "Выбрать"
  applySelect(){
    this.storesSelectDialog.close(this.selectedObjects);
  }

  //удаляет магазин из списка выбранных
  remove(obj: IdAndName): void {
    const index = this.selectedObjects.indexOf(obj);
    if (index >= 0) {
      this.selectedObjects.splice(index, 1);
    }
  }

  //добавляет магазин в список выбранных
  addObjectToList(object: IdAndName){
    if(!this.selectedObjects.includes(object))
      this.selectedObjects.push(object);
  }

}
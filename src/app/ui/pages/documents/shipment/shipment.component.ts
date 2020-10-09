import { Component, OnInit} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-shipment-table.service';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';

export interface CheckBox {
  id: number;
  is_completed:boolean;
  company_id: number;
  department_id: number;
  creator_id: number;
}
export interface idAndName {
  id: number;
  name:string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}


@Component({
  selector: 'app-shipment',
  templateUrl: './shipment.component.html',
  styleUrls: ['./shipment.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class ShipmentComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка СВОИХ отделений
  myCompanyId:number=0;//
  myId:number=0;
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToViewMyDocs:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToUpdateMyDocs:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToDeleteMyDepartments:boolean = false;
  allowToDeleteMyDocs:boolean = false;

  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;

  showOpenDocIcon:boolean=false;

  numRows: NumRow[] = [
    {value: '5', viewValue: '5'},
    {value: '10', viewValue: '10'},
    {value: '25', viewValue: '25'}
  ];
  
  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  //переменные для управления динамическим отображением элементов
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;

  constructor(private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    private Cookie: Cookie,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<ShipmentComponent>,) { }

    ngOnInit() {
      this.sendingQueryForm.companyId='0';
      this.sendingQueryForm.departmentId='0';
      this.sendingQueryForm.sortAsc='desc';
      this.sendingQueryForm.sortColumn='date_time_created_sort';
      this.sendingQueryForm.offset='0';
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.searchCategoryString="";

      if(Cookie.get('shipment_companyId')=='undefined' || Cookie.get('shipment_companyId')==null)     
      Cookie.set('shipment_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('shipment_companyId')=="0"?"0":+Cookie.get('shipment_companyId'));
      if(Cookie.get('shipment_departmentId')=='undefined' || Cookie.get('shipment_departmentId')==null)  
      Cookie.set('shipment_departmentId',this.sendingQueryForm.departmentId); else this.sendingQueryForm.departmentId=(Cookie.get('shipment_departmentId')=="0"?"0":+Cookie.get('shipment_departmentId'));
      if(Cookie.get('shipment_sortAsc')=='undefined' || Cookie.get('shipment_sortAsc')==null)       
      Cookie.set('shipment_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('shipment_sortAsc');
      if(Cookie.get('shipment_sortColumn')=='undefined' || Cookie.get('shipment_sortColumn')==null)    
      Cookie.set('shipment_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('shipment_sortColumn');
      if(Cookie.get('shipment_offset')=='undefined' || Cookie.get('shipment_offset')==null)        
      Cookie.set('shipment_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('shipment_offset');
      if(Cookie.get('shipment_result')=='undefined' || Cookie.get('shipment_result')==null)        
      Cookie.set('shipment_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('shipment_result');

      this.getCompaniesList();// 
      // -> getSetOfPermissions() 
      // -> getMyId()
      // -> getMyCompanyId() 
      // -> setDefaultCompany() 
      // -> getDepartmentsList()
      // -> getMyDepartmentsList()
      // -> setDefaultDepartment()
      // -> getCRUD_rights() 
      // -> getData() 
      //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId
    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    const body = {"documentId": 21};//21= "Отгрузка"
          return this.http.post('/api/auth/giveMeMyPermissions', body) 
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => console.log(error),
            );
  }


  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==253)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==254)});
    this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==255)});
    this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==256)});
    this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==257)});
    this.allowToDeleteMyDepartments = permissionsSet.some(        function(e){return(e==258)});
    this.allowToDeleteMyDocs = permissionsSet.some(               function(e){return(e==259)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==260)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==261)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==262)});
    this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==263)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==264)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==265)});
    this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==266)});
    this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==267)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments||this.allowToViewMyDocs)?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToUpdateMyDepartments||this.allowToUpdateMyDocs)?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany || this.allowToDeleteMyDepartments || this.allowToDeleteMyDocs)?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    this.visBtnAdd = (this.allowToCreate)?true:false;
    
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // console.log("allowToDelete - "+this.allowToDelete);
    // console.log("allowToDeleteAllCompanies - "+this.allowToDeleteAllCompanies);
    return true;
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------



  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      console.log('department 1 = '+this.sendingQueryForm.departmentId);
      this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
      this.doFilterDepartmentsList();//если нет просмотра по свому предприятию - фильтруем список отделений предприятия до своих отделений
      console.log('department 2 = '+this.sendingQueryForm.departmentId);
      this.getTableHeaderTitles();
      this.getPagesList();
      this.getTable();
    }
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('doc_number');
    this.displayedColumns.push('shipment_date');
    this.displayedColumns.push('company');
    this.displayedColumns.push('department');
    this.displayedColumns.push('description');
    this.displayedColumns.push('creator');
    this.displayedColumns.push('status');
    this.displayedColumns.push('date_time_created');
  }

  getPagesList(){
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(this.sendingQueryForm)
            .subscribe(
                data => {this.receivedPagesList=data as string [];
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => console.log(error)
            ); 
  }

  getTable(){
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.dataSource.data = data as any []; 
                  if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
                },
                error => console.log(error) 
            );
  }

  isAllSelected() {//все выбраны
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return  numSelected === numRows;//true если все строки выбраны
  }  

  isThereSelected() {//есть выбранные
    return this.selection.selected.length>0;
  }  

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isThereSelected() ?
    this.resetSelecion() :
        this.dataSource.data.forEach(row => {
          // if(!row.is_completed){this.selection.select(row);}
          if(this.showCheckbox(row)){this.selection.select(row);}//если чекбокс отображаем, значит можно удалять этот документ
        });
        this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }

  resetSelecion(){
    this.selection.clear(); 
  }

  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
    this.isAllSelected();
    this.isThereSelected();
  }

  createCheckedList(){
    this.checkedList = [];
    // console.log("1");
    for (var i = 0; i < this.dataSource.data.length; i++) {
      // console.log("2");
      if(this.selection.isSelected(this.dataSource.data[i]))
      this.checkedList.push(this.dataSource.data[i].id);
    }
    if(this.checkedList.length>0){
      // console.log("3");
        this.hideAllBtns();
        if(this.allowToDelete) this.visBtnDelete = true;
        if(this.checkedList.length==1){this.visBtnCopy = true}
    }else{console.log("");this.showOnlyVisBtnAdd()}
    // console.log("checkedList - "+this.checkedList);
  }

  hideAllBtns(){
    this.visBtnAdd = false;
    this.visBtnDelete = false;
  }
  showOnlyVisBtnAdd(){
    if(this.allowToCreate) this.visBtnAdd = true;
    this.visBtnDelete = false;
  }

  setNumOfPages(){
    this.clearCheckboxSelection();
    this.createCheckedList();
    this.sendingQueryForm.offset=0;
    Cookie.set('shipment_result',this.sendingQueryForm.result);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('shipment_offset',value);
    this.getData();
  }

  clearCheckboxSelection(){
    this.selection.clear();
    this.dataSource.data.forEach(row => this.selection.deselect(row));
  }

  setSort(valueSortColumn:any) // set sorting column
  {
      this.clearCheckboxSelection();
      if(valueSortColumn==this.sendingQueryForm.sortColumn){// если колонка, на которую ткнули, та же, по которой уже сейчас идет сортировка
          if(this.sendingQueryForm.sortAsc=="asc"){
              this.sendingQueryForm.sortAsc="desc"
          } else {  
              this.sendingQueryForm.sortAsc="asc"
          }
      Cookie.set('shipment_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('shipment_sortAsc',"asc");
          Cookie.set('shipment_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    Cookie.set('shipment_companyId',this.sendingQueryForm.companyId);
    Cookie.set('shipment_departmentId','0');
    // console.log('shipment_companyId - '+Cookie.get('shipment_companyId'));
    // console.log('shipment_departmentId - '+Cookie.get('shipment_departmentId'));
    this.sendingQueryForm.departmentId="0"; 
    this.getDepartmentsList();
  }
  onDepartmentSelection(){
    Cookie.set('shipment_departmentId',this.sendingQueryForm.departmentId);
    // console.log('shipment_companyId - '+Cookie.get('shipment_companyId'));
    // console.log('shipment_departmentId - '+Cookie.get('shipment_departmentId'));
    this.getData();
  }
  clickBtnDelete(): void {
    const dialogRef = this.deleteDialog.open(DeleteDialog, {
      width: '300px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteDocks();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }

  deleteDocks(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
          return this.http.post('/api/auth/deleteShipment', body) 
            .subscribe(
                (data) => {   
                            this.getData();
                          },
                error => console.log(error),
            );
    }
    
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.loadSpravService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];
                  this.getSetOfPermissions();
                },
                error => console.log(error)
            );
  }
  getMyId(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => console.log(error)
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => console.log(error));
  }

  setDefaultCompany(){
    if(Cookie.get('shipment_companyId')=='0'){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('shipment_companyId',this.sendingQueryForm.companyId);
    }
      this.getDepartmentsList();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.sendingQueryForm.companyId,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                            this.getMyDepartmentsList();},
                error => console.log(error)
            );
  }

  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.setDefaultDepartment();},
                error => console.log(error)
            );
  }

  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      console.log('установка отделения по умолчанию - '+this.receivedDepartmentsList[0].id);

      this.sendingQueryForm.departmentId=+this.receivedDepartmentsList[0].id;
      Cookie.set('shipment_departmentId',this.sendingQueryForm.departmentId);
    }
  this.getCRUD_rights(this.permissionsSet);
  }

  inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
    let inMyDepthsId:boolean = false;
    this.receivedMyDepartmentsList.forEach(myDepth =>{
      myDepth.id==id?inMyDepthsId=true:null;
    });
  return inMyDepthsId;
  }

  showCheckbox(row:CheckBox):boolean{
    if(!row.is_completed && (
      (this.allowToDeleteAllCompanies)||
      (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId)||
      (this.allowToDeleteMyDepartments && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id))||
      (this.allowToDeleteMyDocs && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id) && row.creator_id==this.myId))
      )return true; else return false;
    }

  doFilterCompaniesList(){
    let myCompany:idAndName;
    if(!this.allowToViewAllCompanies){
      this.receivedCompaniesList.forEach(company=>{
      if(this.myCompanyId==company.id) myCompany={id:company.id, name:company.name}});
      this.receivedCompaniesList=[];
      this.receivedCompaniesList.push(myCompany);
    }
  }

  doFilterDepartmentsList(){
    if( (!this.allowToViewAllCompanies && !this.allowToViewMyCompany && this.allowToViewMyDepartments)||
        (!this.allowToViewAllCompanies && !this.allowToViewMyCompany && !this.allowToViewMyDepartments && this.allowToViewMyDocs)){
      this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
  }

}

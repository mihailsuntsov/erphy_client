import { Component, OnInit} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-statusdocks-table.service';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';

export interface CheckBox {
  id: number;
  company_id: number;
  is_default: boolean;
  name: string;
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
  selector: 'app-statuses',
  templateUrl: './statuses.component.html',
  styleUrls: ['./statuses.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class StatusesComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  receivedDocumentsList: idAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка СВОИХ отделений
  myCompanyId:number=0;//
  myId:number=0;
  checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;

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
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocks:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  constructor(private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    private Cookie: Cookie,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<StatusesComponent>,) { }

    ngOnInit() {
      this.sendingQueryForm.companyId='0';
      this.sendingQueryForm.documentId='0';
      this.sendingQueryForm.sortAsc='asc';
      this.sendingQueryForm.sortColumn='output_order';
      this.sendingQueryForm.offset='0';
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.filterOptionsIds = [];

      if(Cookie.get('satusdock_companyId')=='undefined' || Cookie.get('satusdock_companyId')==null)     
        Cookie.set('satusdock_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('satusdock_companyId')=="0"?"0":+Cookie.get('satusdock_companyId'));
      if(Cookie.get('satusdock_documentId')=='undefined' || Cookie.get('satusdock_documentId')==null)  
        Cookie.set('satusdock_documentId',this.sendingQueryForm.documentId); else this.sendingQueryForm.documentId=(Cookie.get('satusdock_documentId')=="0"?"0":+Cookie.get('satusdock_documentId'));
      if(Cookie.get('satusdock_sortAsc')=='undefined' || Cookie.get('satusdock_sortAsc')==null)       
        Cookie.set('satusdock_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('satusdock_sortAsc');
      if(Cookie.get('satusdock_sortColumn')=='undefined' || Cookie.get('satusdock_sortColumn')==null)    
        Cookie.set('satusdock_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('satusdock_sortColumn');
      if(Cookie.get('satusdock_offset')=='undefined' || Cookie.get('satusdock_offset')==null)        
        Cookie.set('satusdock_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('satusdock_offset');
      if(Cookie.get('satusdock_result')=='undefined' || Cookie.get('satusdock_result')==null)        
        Cookie.set('satusdock_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('satusdock_result');

      this.fillOptionsList();//заполняем список опций фильтра
      this.getCompaniesList();// 
      // -> getSetOfPermissions() 
      // -> getMyId()
      // -> getMyCompanyId() 
      // -> setDefaultCompany() 
      // -> getDocumentsList()
      // -> setDefaultDocument()
      // -> getCRUD_rights() 
      // -> getData() 
      //API: getCompaniesList         giveMeMyPermissions      getMyCompanyId
    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    const body = {"documentId": 22};//22= "Статусы документов"
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
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==271)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==272)});
    this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==273)});
    this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==274)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==275)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==276)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==277)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==278)});
    this.getData();
  }

  refreshPermissions():boolean{
    let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany)?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany)?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany)?true:false;
    this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany)?true:false;
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
    // console.log('before if!');
    if(this.refreshPermissions() && this.allowToView)
    {
      // console.log('after if!');
      this.updateSortOptions();
      this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
      this.getTableHeaderTitles();
      this.updateSortOptions();
      this.getPagesList();
      this.getTable();
    }
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('output_order');
    this.displayedColumns.push('is_default');
    this.displayedColumns.push('company');
    this.displayedColumns.push('description');
    this.displayedColumns.push('creator');
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
    for (var i = 0; i < this.dataSource.data.length; i++) {
      if(this.selection.isSelected(this.dataSource.data[i]))
        this.checkedList.push(this.dataSource.data[i].id);
    }
    if(this.checkedList.length>0){
        this.hideAllBtns();
        if(this.allowToDelete) this.visBtnDelete = true;
        if(this.checkedList.length==1){this.visBtnCopy = true}
    }else{this.showOnlyVisBtnAdd()}
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
    Cookie.set('satusdock_result',this.sendingQueryForm.result);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('satusdock_offset',value);
    this.getData();
  }

  clearCheckboxSelection(){
    this.selection.clear();
    this.createCheckedList();//тут перерасчитывается vizBtnDelete
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
      Cookie.set('satusdock_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('satusdock_sortAsc',"asc");
          Cookie.set('satusdock_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    Cookie.set('satusdock_companyId',this.sendingQueryForm.companyId);
    this.sendingQueryForm.documentId="0"; 
    this.resetOptions();
    this.getDocumentsList();
  }
  onDocumentSelection(){
    Cookie.set('satusdock_documentId',this.sendingQueryForm.documentId);
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
  clickBtnRestore(): void {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Восстановление',
        query: 'Восстановить выбранные статусы из удалённых?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.undeleteDocks();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  undeleteDocks(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
      return this.http.post('/api/auth/undeleteSpravStatusDocks', body) 
    .subscribe(
        (data) => {   
                    this.getData();
                    this.openSnackBar("Успешно восстановлено", "Закрыть");
                  },
        error => console.log(error),
    );
  }
  deleteDocks(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
          return this.http.post('/api/auth/deleteSpravStatusDocks', body) 
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
    if(Cookie.get('satusdock_companyId')=='0'){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('satusdock_companyId',this.sendingQueryForm.companyId);
    }
      this.getDocumentsList();
  }

  getDocumentsList(){
    this.receivedDocumentsList=this.loadSpravService.getDocumentsList();
    this.setDefaultDocument();
  }

  setDefaultDocument(){
    console.log('Document length = '+this.receivedDocumentsList.length);
    if(this.receivedDocumentsList.length>1)
    {
      this.sendingQueryForm.documentId=(Cookie.get('satusdock_documentId')=="0"?this.receivedDocumentsList[0].id:+Cookie.get('satusdock_documentId'))
    } else {
      this.sendingQueryForm.documentId=+this.receivedDocumentsList[0].id;
      Cookie.set('satusdock_documentId',this.sendingQueryForm.documentId);
    }
  this.getCRUD_rights(this.permissionsSet);
  }

  showCheckbox(row:CheckBox):boolean{
    if(
        (this.allowToDeleteAllCompanies)||
        (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId)
      )
      return true; else return false;
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

  onClickRadioBtn(id:number, name:string){
    const body = {"id": this.sendingQueryForm.companyId, "id2":this.sendingQueryForm.documentId, "id3":id}; 
    this.clearCheckboxSelection();
      return this.http.post('/api/auth/setDefaultStatusDock', body) 
    .subscribe(
        (data) => {   
          this.getData();
                    this.openSnackBar("Статус "+name+" успешно установлен по-умолчанию", "Закрыть");
                  },
        error => {this.openSnackBar("Недостаточно прав!", "Закрыть"); console.log(error);this.getData();},
    );
  }
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  resetOptions(){
    this.displayingDeletedDocks=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear;
    this.sendingQueryForm.filterOptionsIds = [];
  }
  fillOptionsList(){
    this.optionsIds=[{id:1, name:"Показать только удалённые"},];
  }
  clickApplyFilters(){
    let showOnlyDeletedCheckboxIsOn:boolean = false; //присутствует ли включенный чекбокс "Показывать только удалённые"
    this.selectionFilterOptions.selected.forEach(z=>{
      if(z.id==1){showOnlyDeletedCheckboxIsOn=true;}
    })
    this.displayingDeletedDocks=showOnlyDeletedCheckboxIsOn;
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=0;//сброс пагинации
    this.getData();
  }
  updateSortOptions(){//после определения прав пересматриваем опции на случай, если права не разрешают действия с определенными опциями, и исключаем эти опции
    let i=0; 
    this.optionsIds.forEach(z=>{
      console.log("allowToDelete - "+this.allowToDelete);
      if(z.id==1 && !this.allowToDelete){this.optionsIds.splice(i,1)}//исключение опции Показывать удаленные, если нет прав на удаление
      i++;
    });
    if (this.optionsIds.length>0) this.displaySelectOptions=true; else this.displaySelectOptions=false;//если опций нет - не показываем меню опций
  }
  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  createFilterOptionsCheckedList(){//this.sendingQueryForm.filterOptionsIds - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при нажатии на чекбокс
    this.sendingQueryForm.filterOptionsIds = [];//                                                     
    this.selectionFilterOptions.selected.forEach(z=>{
      this.sendingQueryForm.filterOptionsIds.push(+z.id);
    });
  }
}

import { Component, OnInit} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-expenditure-table.service';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';

export interface CheckBox {
  id: number;
  company_id: number;
  is_default: boolean;
  name: string;
}
export interface idAndName {
  id: any;
  name:string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-expenditure',
  templateUrl: './expenditure.component.html',
  styleUrls: ['./expenditure.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class ExpenditureComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [] ;//массив для получения данных пагинации
  dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
  receivedExpenditureList: idAndName [] = [];//массив для получения списка расходов
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

  gettingTableData:boolean=true;//!!!

  //переменные для управления динамическим отображением элементов
  visBtnAdd:boolean;
  visBtnCopy = false;
  visBtnDelete = false;
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  constructor(private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private MessageDialog: MatDialog,
    private http: HttpClient,
    private Cookie: Cookie,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<ExpenditureComponent>,) { }

    ngOnInit() {
      this.sendingQueryForm.companyId='0';
      this.sendingQueryForm.sortAsc='asc';
      this.sendingQueryForm.sortColumn='name';
      this.sendingQueryForm.offset='0';
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.filterOptionsIds = [];

      if(Cookie.get('expenditure_companyId')=='undefined' || Cookie.get('expenditure_companyId')==null)     
        Cookie.set('expenditure_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('expenditure_companyId')=="0"?"0":+Cookie.get('expenditure_companyId'));
      if(Cookie.get('expenditure_sortAsc')=='undefined' || Cookie.get('expenditure_sortAsc')==null)       
        Cookie.set('expenditure_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('expenditure_sortAsc');
      if(Cookie.get('expenditure_sortColumn')=='undefined' || Cookie.get('expenditure_sortColumn')==null)    
        Cookie.set('expenditure_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('expenditure_sortColumn');
      if(Cookie.get('expenditure_offset')=='undefined' || Cookie.get('expenditure_offset')==null)        
        Cookie.set('expenditure_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('expenditure_offset');
      if(Cookie.get('expenditure_result')=='undefined' || Cookie.get('expenditure_result')==null)        
        Cookie.set('expenditure_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('expenditure_result');

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
    return this.http.get('/api/auth/getMyPermissions?id=40')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => console.log(error),
            );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==498)});
    this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==499)});
    this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==500)});
    this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==501)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==502)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==503)});
    this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==504)});
    this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==505)});
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
      //!!!
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Нет прав на просмотр"}})}
  }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete) this.displayedColumns.push('select');
    if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('type');
    this.displayedColumns.push('company');
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
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})} 
            ); 
  }

  getTable(){//!!!
    this.gettingTableData=true;
    this.queryFormService.getTable(this.sendingQueryForm)
            .subscribe(
                (data) => {
                  this.dataSource.data = data as any []; 
                  if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
                  this.gettingTableData=false;
                },
                error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})} 
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
    Cookie.set('expenditure_result',this.sendingQueryForm.result);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('expenditure_offset',value);
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
      Cookie.set('expenditure_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
          Cookie.set('expenditure_sortAsc',"asc");
          Cookie.set('expenditure_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  onCompanySelection(){
    Cookie.set('expenditure_companyId',this.sendingQueryForm.companyId);
    this.resetOptions();
    this.getExpenditureList();
  }

  clickBtnDelete(): void {
    const dialogRef = this.deleteDialog.open(DeleteDialog, {
      width: '300px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  
  getExpenditureNameById(id:string):string{
    let name:string = 'Не установлен';
    if(this.receivedExpenditureList){
      this.receivedExpenditureList.forEach(a=>{
        if(a.id==id) name=a.name;
      })}
    return(name);
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
      if(result==1){this.undeleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
    
  deleteDocs(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/deleteExpenditure', body) 
    .subscribe((data) => {   
      let result=data as any;
      switch(result){
        case 1:{this.getData();this.openSnackBar("Успешно удалено", "Закрыть");break;} 
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе удаления проиошла ошибка")}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
      }
    },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
  }

  undeleteDocs(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
     return this.http.post('/api/auth/undeleteExpenditure', body) 
    .subscribe(
        (data) => {   
          let result=data as any;
          switch(result){
            case 1:{this.getData();this.openSnackBar("Успешно удалено", "Закрыть");break;} 
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе операции проиошла ошибка")}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для данной операции"}});break;}
          }
        },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},);
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
    if(Cookie.get('expenditure_companyId')=='0'){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('expenditure_companyId',this.sendingQueryForm.companyId);
    }
      this.getExpenditureList();
  }

  getExpenditureList(){
    this.receivedExpenditureList=this.loadSpravService.getExpenditureList();
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

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  resetOptions(){
    this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
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
    this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
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

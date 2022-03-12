import { Component } from '@angular/core';
import { QueryFormService } from './query-forms.service';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { LoadSpravService } from '../../../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { HttpClient } from '@angular/common/http';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface CompaniesTable {
  id: number;
  name: string;
  date_time_created: string;
  date_time_changed: string;
  owner_id: number;
  creator_id: number;
  changer_id: number;
  owner: string;
  creator: string;
  changer: number;
  namefull: string;
  addressjur: string;
  addressfact: string;
  opf_name: string;
  opf_id: number;
  inn: string;
  reg_num: string;
  who_got: string ;
  datereg: string;
  korschet: string;
  rs: string;
  bank: string;
  bik: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: string;
  name: string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css'],

  providers: [QueryFormService,Cookie]
})
export class CompaniesComponent {

  myCompanyId:number=0;//
  myId:number=0;
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: CompaniesTable [] = [];//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<CompaniesTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CompaniesTable>(true, []);//Class to be used to power selecting one or more options from a list.

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToDeleteMyCompany:boolean = false;

  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;

  showOpenDocIcon:boolean=false;

  gettingTableData:boolean=true;//!!!
 
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
  visBtnDelete = false;

  //Управление чекбоксами
  checkedList:number[]=[];  //строка для накапливания id вида [2,5,27...]

//***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [] = [{id:"1", name:"Показать только удалённые"},]
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
//***********************************************************************************************************************/

  constructor(
  private loadSpravService:   LoadSpravService,
  private _snackBar: MatSnackBar,
  private queryFormService:   QueryFormService,
  private http: HttpClient,
  private MessageDialog: MatDialog,
  private Cookie: Cookie,
  public deleteDialog: MatDialog,
  public ConfirmDialog: MatDialog) {}

  ngOnInit() 
  {
    this.sendingQueryForm.sortAsc="asc";
    this.sendingQueryForm.sortColumn="p.name";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="10";
    this.sendingQueryForm.filterOptionsIds = [];
    this.getSetOfPermissions();

    if(Cookie.get('companies_sortAsc')=='undefined' || Cookie.get('companies_sortAsc')==null)       
      Cookie.set('companies_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('companies_sortAsc');
    if(Cookie.get('companies_sortColumn')=='undefined' || Cookie.get('companies_sortColumn')==null)    
      Cookie.set('companies_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('companies_sortColumn');
    if(Cookie.get('companies_offset')=='undefined' || Cookie.get('companies_offset')==null)        
      Cookie.set('companies_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('companies_offset');
    if(Cookie.get('companies_result')=='undefined' || Cookie.get('companies_result')==null)        
      Cookie.set('companies_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('companies_result');
  }

  getData(){
    if(this.refreshPermissions() && this.allowToView)
    {
      this.getTableHeaderTitles();
      this.getPagesList();
      this.getTable();
      //!!!
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Нет прав на просмотр"}})}
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=3')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            console.log("permissions:"+this.permissionsSet);
                            this.getCRUD_rights();
                        },
                error => console.log(error),
            );
  }

  getCRUD_rights(){
    this.allowToCreateAllCompanies = this.permissionsSet.some(         function(e){return(e==3)});
    this.allowToCreateMyCompany = this.permissionsSet.some(            function(e){return(e==3)});
    this.allowToDeleteAllCompanies = this.permissionsSet.some(         function(e){return(e==4)});
    this.allowToDeleteMyCompany = this.permissionsSet.some(            function(e){return(e==4)});
    this.allowToViewAllCompanies = this.permissionsSet.some(           function(e){return(e==6)});
    this.allowToViewMyCompany = this.permissionsSet.some(              function(e){return(e==5)});
    this.allowToUpdateAllCompanies = this.permissionsSet.some(         function(e){return(e==8)});
    this.allowToUpdateMyCompany = this.permissionsSet.some(            function(e){return(e==7)});
    this.getData();
  }
      
  refreshPermissions():boolean{
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany)?true:false;
    this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany)?true:false;
    this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany)?true:false;
    this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany)?true:false;
    this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    this.visBtnAdd = this.allowToCreate;
    this.updateSortOptions();
    // console.log("allowToView - "+this.allowToView);
    // console.log("allowToUpdate - "+this.allowToUpdate);
    // console.log("allowToCreate - "+this.allowToCreate);
    // console.log("allowToDelete - "+this.allowToDelete);
    // console.log("allowToDeleteAllCompanies - "+this.allowToDeleteAllCompanies);
    return true;
  }

  // getMyId(){
  //   this.loadSpravService.getMyId()
  //           .subscribe(
  //               (data) => {this.myId=data as any;
  //                 this.getMyCompanyId();},
  //               error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
  //           );
  // }
  // getMyCompanyId(){
  //   this.loadSpravService.getMyCompanyId().subscribe(
  //     (data) => {
  //       this.myCompanyId=data as number;
  //       this.getCRUD_rights();
  //     }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  // }

  getTableHeaderTitles(){
    this.displayedColumns=[];
    if(this.allowToDelete) this.displayedColumns.push('select');
    if(this.allowToUpdateMyCompany||this.allowToUpdateAllCompanies||this.allowToViewMyCompany||this.allowToViewAllCompanies) this.displayedColumns.push('opendoc');
    this.displayedColumns.push('name');
    this.displayedColumns.push('creator');
    this.displayedColumns.push('date_time_created');
  }
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;//true если все строки выбраны
  }  
  
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
        this.createCheckedList();
  }
  
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: CompaniesTable): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
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
    }else{this.showOnlyVisBtnAdd()}
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
  
  getPagesList(){
    this.donePagesList = false;
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(this.sendingQueryForm)
      .subscribe(
          data => {this.receivedPagesList=data as string []; this.donePagesList=true;
          this.size=this.receivedPagesList[0];
          this.pagenum=this.receivedPagesList[1];
          this.listsize=this.receivedPagesList[2];
          this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
          error => console.log(error)
      ); 
  }
  
  setNumOfPages(){
    this.clearCheckboxSelection();
    this.createCheckedList();
    this.sendingQueryForm.offset=0;
    Cookie.set('companies_result',this.sendingQueryForm.result);
    this.getData();
  }
  
  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('companies_offset',value);
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
    Cookie.set('companies_sortAsc',this.sendingQueryForm.sortAsc);
    } else {
        this.sendingQueryForm.sortColumn=valueSortColumn;
        this.sendingQueryForm.sortAsc="asc";
        Cookie.set('companies_sortAsc',this.sendingQueryForm.sortAsc);
        Cookie.set('companies_sortColumn',valueSortColumn);
    }
    this.getData();
  }

  deleteCompanies(){
    const body = {"checked": this.checkedList.join()};
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/deleteCompanies', body) 
            .subscribe(
                (data) => {   
                            this.receivedMatTable=data as any []; 
                            this.dataSource.data = this.receivedMatTable;
                            this.openSnackBar("Успешно удалено", "Закрыть");
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
  undeleteCompanies(){
    const body = {"checked": this.checkedList.join()};
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/undeleteCompanies', body) 
            .subscribe(
                (data) => {   
                            this.receivedMatTable=data as any []; 
                            this.dataSource.data = this.receivedMatTable;
                            this.openSnackBar("Успешно восстановлено", "Закрыть");
                            this.getData();
                        },
                error => console.log(error),
            );
  }
  clickBtnDelete(): void {
    const dialogRef = this.deleteDialog.open(DeleteDialog, {
      width: '300px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.deleteCompanies();}
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
        query: 'Восстановить предприятие из удалённых?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.undeleteCompanies();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  hideAllBtns(){
    this.visBtnAdd = false;
    this.visBtnDelete = false;
  }

  showOnlyVisBtnAdd(){
    if(this.allowToCreate) this.visBtnAdd = true;
    this.visBtnDelete = false;
  }

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  clickApplyFilters(){
    let showOnlyDeletedCheckboxIsOn:boolean = false; //присутствует ли включенный чекбокс "Показывать только удалённые"
    this.selectionFilterOptions.selected.forEach(z=>{
      if(z.id=='1'){showOnlyDeletedCheckboxIsOn=true;}
    })
    this.displayingDeletedDocs=showOnlyDeletedCheckboxIsOn;
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=0;//сброс пагинации
    this.getData();
  }
  updateSortOptions(){//после определения прав пересматриваем опции на случай, если права не разрешают действия с определенными опциями, и исключаем эти опции
    let i=0; 
    this.optionsIds.forEach(z=>{
      if(z.id=='1' && !this.allowToDelete){this.optionsIds.splice(i,1)}//исключение опции Показывать удаленные, если нет прав на удаление
      i++;
    });
    if (this.optionsIds.length>0) this.displaySelectOptions=true; else this.displaySelectOptions=false;
  }
  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 
  createFilterOptionsCheckedList(){//sendingQueryForm.filterOptionsIds - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при нажатии на чекбокс
    this.sendingQueryForm.filterOptionsIds = [];//                                                       
    this.selectionFilterOptions.selected.forEach(z=>{
      // if(this.selectionFilterOptions.isSelected(z))
      this.sendingQueryForm.filterOptionsIds.push(+z.id);
    });
    
  }
}


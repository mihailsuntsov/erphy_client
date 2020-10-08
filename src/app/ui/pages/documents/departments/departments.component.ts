import { Component, OnInit } from '@angular/core';
import { QueryFormService } from './query-forms.service';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';

export interface DepartmentsTable {
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
  address: string;
  additional: string;
  company_id: number;
  parent_id: number;
  num_childrens: number;
  row_status: string; // open close nochilds
}

export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css'],

  providers: [QueryFormService,
              LoadSpravService]
  
})
export class DepartmentsComponent implements OnInit {

  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DepartmentsTable []=[];//массив для получения данных для материал таблицы
  receivedChildrens: DepartmentsTable [];//массив для получения детей
  resultTable: DepartmentsTable [];//массив для формирования таблицы с родителями и детьми
  dataSource = new MatTableDataSource<DepartmentsTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы//displayedColumns: string[] = ['select','show_childrens', 'opendoc', 'name', 'address', 'creator', 'date_time_created'];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DepartmentsTable>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [];//массив для получения списка предприятий
 
  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowToUpdateMy:boolean = false;
  allowToUpdateAll:boolean = false;
  allowToViewMy:boolean = false;
  allowToViewAll:boolean = false;
  isItMyDock:boolean = false;
 
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
  checkedList:any; //строка для накапливания id вида [2,5,27...]

  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private http: HttpClient,
    public deleteDialog: MatDialog) { }

  ngOnInit() {
    this.sendingQueryForm.sortAsc="asc";
    this.sendingQueryForm.sortColumn="name";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="10";
    this.sendingQueryForm.companyId="0";
    this.getCompaniesList();
    this.getSetOfPermissions();
  }
// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  const body = {"documentId": 4};//4=Отделения
        return this.http.post('/api/auth/giveMeMyPermissions', body) 
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          console.log("permissions:"+this.permissionsSet);
                          this.getCRUD_rights(this.permissionsSet);
                      },
              error => console.log(error),
          );
}
getCRUD_rights(permissionsSet:any[]){
  this.allowToCreate = permissionsSet.some(this.isAllowToCreate);
  this.allowToDelete = permissionsSet.some(this.isAllowToDelete);
  this.allowToUpdateMy = permissionsSet.some(this.isAllowToUpdateMy);
  this.allowToUpdateAll = permissionsSet.some(this.isAllowToUpdateAll);
  this.allowToViewMy = permissionsSet.some(this.isAllowToViewMy);
  this.allowToViewAll = permissionsSet.some(this.isAllowToViewAll);
  // console.log("allowToCreate:"+this.allowToCreate);
  // console.log("allowToDelete:"+this.allowToDelete);
  // console.log("allowToUpdateMy:"+this.allowToUpdateMy);
  // console.log("allowToUpdateAll:"+this.allowToUpdateAll);
  this.visBtnAdd=this.allowToCreate;
  this.getTableHeaderTitles();
  this.getData();
}
isAllowToCreate   (e){return(e==11);}
isAllowToDelete   (e){return(e==12);}
isAllowToUpdateMy (e){return(e==15);}
isAllowToUpdateAll(e){return(e==16);}
isAllowToViewMy   (e){return(e==13);}
isAllowToViewAll  (e){return(e==14);}

getTableHeaderTitles(){
  if(this.allowToDelete) this.displayedColumns.push('select');
  if(this.allowToUpdateMy||this.allowToUpdateAll||this.allowToViewMy||this.allowToViewAll) this.displayedColumns.push('opendoc');
  this.displayedColumns.push('name');
  this.displayedColumns.push('address');
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
  checkboxLabel(row?: DepartmentsTable): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  getCompaniesList(){
    this.receivedCompaniesList=null;
    this.httpService.getCompaniesList()
            .subscribe(
                (data) => {this.receivedCompaniesList=data as any [];console.log("receivedCompaniesList-"+this.receivedCompaniesList)},
                error => console.log(error)
            );
  }

  showChildrens(parentId:number){
    this.receivedChildrens=[];
    this.receivedMatTable=this.dataSource.data;
    this.resultTable = [];
    var i:number = 0;
    var x:number = 0;
    this.queryFormService.getChildrens(parentId).subscribe(
        (data) => {
          this.receivedChildrens=data as any []; 
          for(i=0;i<this.receivedMatTable.length;i++) {
            if(this.receivedMatTable[i].id==parentId){
              this.receivedMatTable[i].row_status="open";
            }
            this.resultTable.push(this.receivedMatTable[i]);
            if(this.receivedMatTable[i].id==parentId){
              for(x=0; x < this.receivedChildrens.length;x++) {
                this.resultTable.push(this.receivedChildrens[x]);
          } } }  
          this.dataSource.data = this.resultTable;
        },
        error => console.log(error) 
    );
  }

  hideChildrens(parentId:number){
    this.receivedMatTable=this.dataSource.data;
    this.resultTable = [];
    var i:number = 0;
    for(i=0;i<this.receivedMatTable.length;i++) {
      if(this.receivedMatTable[i].id==parentId){
        this.receivedMatTable[i].row_status="close";
      }
      if(this.receivedMatTable[i].parent_id!=parentId){
        this.resultTable.push(this.receivedMatTable[i]);
      }
    }
    this.dataSource.data = this.resultTable;
  }
  

  clickTableCheckbox(row){
    this.selection.toggle(row); 
    this.createCheckedList();
  }

  createCheckedList(){
    this.checkedList = [];

    for (var i = 0; i < this.receivedMatTable.length; i++) {
      if(this.selection.isSelected(this.receivedMatTable[i]))
      this.checkedList.push(this.receivedMatTable[i].id);
    }
    this.checkedList = JSON.stringify(this.checkedList);
    if(this.checkedList.length>2){
        this.hideAllBtns();
        if(this.allowToDelete) this.visBtnDelete = true;
    }else{this.showOnlyVisBtnAdd()}
    console.log("checkedList - "+this.checkedList);

  }

  getData(){
    this.getPagesList(this.sendingQueryForm);
    this.getTable(this.sendingQueryForm);
  }

  setRowsStatus(){//после загрузки таблицы устанавливает статусы строк (open / close / nochilds)
    var i:number = 0;
    for(i=0;i<this.receivedMatTable.length;i++) {
      if(this.receivedMatTable[i].num_childrens>0){
        this.receivedMatTable[i].row_status="close";
      } else {
        this.receivedMatTable[i].row_status="nochilds";
      }
    }  
  }

  getTable(sendingQueryForm: QueryForm){
    this.queryFormService.getTable(sendingQueryForm)
            .subscribe(
                (data) => {
                  this.receivedMatTable=data as any []; 
                  this.dataSource.data = this.receivedMatTable;
                  this.setRowsStatus();
                },
                error => console.log(error) 
            );
  }

  getPagesList(sendingQueryForm: QueryForm){
    this.donePagesList = false;
    // this.receivedPagesList=null;
    this.queryFormService.getPagesList(sendingQueryForm)
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
    this.getData();
  }
  
  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
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
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="asc";
      }
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
    const body = {"checked": this.checkedList};
    this.clearCheckboxSelection();
        return this.http.post('/api/auth/deleteDepartments', body) 
        .subscribe(
            (data) => {   
                        this.receivedMatTable=data as any []; 
                        this.dataSource.data = this.receivedMatTable;
                        this.getData();
                    },
            error => console.log(error),
        );
  }

  hideAllBtns(){
    this.visBtnAdd = false;
    this.visBtnDelete = false;
  }

  showOnlyVisBtnAdd(){
    if(this.allowToCreate) this.visBtnAdd = true;
    this.visBtnDelete = false;
  }

}

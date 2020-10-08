import { Component, OnInit } from '@angular/core';
import { QueryFormService } from './query-forms.service';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';


export interface DockTable {
  id: number;
  name: string;
  creator_id: number;
  date_time_created: string;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  providers: [QueryFormService,
    LoadSpravService]
})
export class UsersComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DockTable []=[] ;//массив для получения данных для материал таблицы
  resultTable: DockTable [];//массив для формирования таблицы с родителями и детьми
  dataSource = new MatTableDataSource<DockTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы//displayedColumns: string[] = ['select', 'opendoc','name', 'status_account','creator', 'date_time_created'];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DockTable>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [];//массив для получения списка документов
 
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
      this.sendingQueryForm.result="5";
      this.sendingQueryForm.companyId="0";
      this.getCompaniesList();
      this.getSetOfPermissions();
    }

    getData(){
      this.getPagesList(this.sendingQueryForm);
      this.getTable(this.sendingQueryForm);
    }
// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  const body = {"documentId": 5};//5=Пользователи
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
isAllowToCreate   (e){return(e==22);}
isAllowToDelete   (e){return(e==23);}
isAllowToUpdateMy (e){return(e==26);}
isAllowToUpdateAll(e){return(e==27);}
isAllowToViewMy   (e){return(e==24);}
isAllowToViewAll  (e){return(e==25);}

getTableHeaderTitles(){
  if(this.allowToDelete) this.displayedColumns.push('select');
  if(this.allowToUpdateMy||this.allowToUpdateAll||this.allowToViewMy||this.allowToViewAll) this.displayedColumns.push('opendoc');
  this.displayedColumns.push('name');
  this.displayedColumns.push('status_account');
  this.displayedColumns.push('creator');
  this.displayedColumns.push('date_time_created');
}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
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

    getTable(sendingQueryForm: QueryForm){
      this.queryFormService.getTable(sendingQueryForm)
              .subscribe(
                  (data) => {
                    this.receivedMatTable=data as any []; 
                    this.dataSource.data = this.receivedMatTable;
                  },
                  error => console.log(error) 
              );
    }

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
    checkboxLabel(row?: DockTable): string {
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
        return this.http.post('/api/auth/deleteUsers', body) 
              .subscribe(
                  (data) => {   
                              this.receivedMatTable=data as any []; 
                              this.dataSource.data = this.receivedMatTable;
                              this.getData();
                          },
                  error => console.log(error),
              );
      }



    getCompaniesList(){
      this.receivedCompaniesList=null;
      this.httpService.getCompaniesList()
              .subscribe(
                  (data) => {this.receivedCompaniesList=data as any [];console.log("receivedCompaniesList-"+this.receivedCompaniesList)},
                  error => console.log(error)
              );
    }

    



  
}

import { Component, OnInit } from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-productgroups-table.service';


export interface DockTable {
  id: number;
}
export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}


@Component({
  selector: 'app-productgroups',
  templateUrl: './productgroups.component.html',
  styleUrls: ['./productgroups.component.css'],
  providers: [QueryFormService,LoadSpravService]
})
export class ProductgroupsComponent implements OnInit {

  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DockTable []=[] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DockTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DockTable>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [];//массив для получения списка предприятий
 
  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
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

  //Управление чекбоксами
  checkedList:number[]=[]; //строка для накапливания id вида [2,5,27...]


  constructor(private queryFormService:   QueryFormService,
    private httpService:   LoadSpravService,
    private http: HttpClient,
    public deleteDialog: MatDialog) { }
      
    ngOnInit() {
      this.sendingQueryForm.sortAsc="desc";
      this.sendingQueryForm.sortColumn="p.name";
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result="10";
      this.sendingQueryForm.companyId="0";
      this.getCompaniesList();
      this.getSetOfPermissions();
    }

// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=10')
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          this.getCRUD_rights(this.permissionsSet);
                      },
              error => console.log(error),
          );
}
getCRUD_rights(permissionsSet:any[]){
  this.allowToCreate = permissionsSet.some(this.isAllowToCreate);//some проверяет, удовлетворяет ли хоть какой-нибудь элемент массива условию, заданному в передаваемой функции
  this.allowToDelete = permissionsSet.some(this.isAllowToDelete);
  this.allowToViewAllCompanies = permissionsSet.some(this.isAllowToViewAllCompanies);
  this.allowToViewMyCompany = permissionsSet.some(this.isAllowToViewMyCompany);
  this.allowToUpdateAllCompanies = permissionsSet.some(this.isAllowToUpdateAllCompanies);
  this.allowToUpdateMyCompany = permissionsSet.some(this.isAllowToUpdateMyCompany);
  this.showOpenDocIcon=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToViewAllCompanies||this.allowToViewMyCompany);
  this.visBtnAdd=this.allowToCreate;
  this.visBtnCopy=this.allowToCreate;//т.к. клониролвать документ = создавать
  this.getTableHeaderTitles();
  //this.getData();
}

isAllowToViewAllCompanies(e){return(e==113);}      //просмотр доков всех доступных предприятий
isAllowToViewMyCompany(e){return(e==114);}         //просмотр доков моего предприятия
isAllowToUpdateAllCompanies(e){return(e==115);}    //редактирование доков всех доступных предприятий
isAllowToUpdateMyCompany(e){return(e==116);}       //редактирование доков моего предприятия
isAllowToDelete   (e){return(e==112);}
isAllowToCreate   (e){return(e==111);}


getTableHeaderTitles(){
  if(this.allowToDelete) this.displayedColumns.push('select');
  if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
  //this.displayedColumns.push('id');
  this.displayedColumns.push('name');
  this.displayedColumns.push('description');
  this.displayedColumns.push('creator');
  this.displayedColumns.push('date_time_created');
}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
    getData(){
      this.getPagesList(this.sendingQueryForm);
      this.getTable(this.sendingQueryForm);

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

    getTable(sendingQueryForm: QueryForm){
      console.log("перед вызовом 1");
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
     // this.checkedList = JSON.stringify(this.checkedList);
      if(this.checkedList.length>0){
          this.hideAllBtns();
          if(this.allowToDelete) this.visBtnDelete = true;
          if(this.checkedList.length==1){this.visBtnCopy = true}
      }else{this.showOnlyVisBtnAdd()}
      console.log("checkedList - "+this.checkedList);
    }

    hideAllBtns(){
      this.visBtnAdd = false;
      this.visBtnDelete = false;
      //this.visBtnCopy = false;
    }
    showOnlyVisBtnAdd(){
      if(this.allowToCreate) this.visBtnAdd = true;
      this.visBtnDelete = false;
      this.visBtnCopy = false;
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
    clickBtnCopy(): void{
      this.copyDock();
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    }

    copyDock(){
      const body = {"id": +this.checkedList.join()};
      return this.http.post('/api/auth/copyProductGroups', body) 
          .subscribe(
              (data) => {   
                          this.receivedMatTable=data as any []; 
                          this.dataSource.data = this.receivedMatTable;
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
        if(result==1){this.deleteDocks();}
        this.clearCheckboxSelection();
        this.showOnlyVisBtnAdd();
      });        
    }

    deleteDocks(){
      const body = {"checked": this.checkedList.join()};
      this.clearCheckboxSelection();
            return this.http.post('/api/auth/deleteProductGroups', body) 
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
                  (data) => {this.receivedCompaniesList=data as any [];
                    this.getData();
                  },
                  error => console.log(error)
              );
    }


}

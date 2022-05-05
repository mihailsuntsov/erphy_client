import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MatDialog } from '@angular/material/dialog';
// import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-pricetypes-table.service';
import { LoadSpravService } from '../../../../services/loadsprav';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++

export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}

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
@Component({
  selector: 'app-pricetypes',
  templateUrl: './pricetypes.component.html',
  styleUrls: ['./pricetypes.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService]
})

export class PricetypesComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  donePagesList: boolean = false;
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: CheckBox [] =[];//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<CheckBox>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<CheckBox>(true, []);//Class to be used to power selecting one or more options from a list.
  receivedCompaniesList: any [] = [];//массив для получения списка предприятий
  receivedSpravSysPriceRole: any [];//Справочник роли цены (Основная, Скидочная)
  myCompanyId:number=0;
  myId:number=0;
 
  //переменные прав
  permissionsSet: any[];//сет прав на документ

  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  showOpenDocIcon:boolean=false;
  gettingTableData:boolean=true;//!!!

  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Класс, который взаимодействует с чекбоксами и хранит их состояние
  optionsIds: idAndName [];
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

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
  checkedList:any[]=[]; //строка для накапливания id вида [2,5,27...]

  constructor(private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    public deleteDialog: MatDialog,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,) { }
      
    ngOnInit() {
      this.sendingQueryForm.companyId='0';
      this.sendingQueryForm.sortAsc='desc';
      this.sendingQueryForm.sortColumn='date_time_created_sort';
      this.sendingQueryForm.offset='0';
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.filterOptionsIds = [];

      if(Cookie.get('pricetypes_companyId')=='undefined' || Cookie.get('pricetypes_companyId')==null)     
        Cookie.set('pricetypes_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('pricetypes_companyId')=="0"?"0":+Cookie.get('pricetypes_companyId'));
      if(Cookie.get('pricetypes_sortAsc')=='undefined' || Cookie.get('pricetypes_sortAsc')==null)       
        Cookie.set('pricetypes_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('pricetypes_sortAsc');
      if(Cookie.get('pricetypes_sortColumn')=='undefined' || Cookie.get('pricetypes_sortColumn')==null)    
        Cookie.set('pricetypes_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('pricetypes_sortColumn');
      if(Cookie.get('pricetypes_offset')=='undefined' || Cookie.get('pricetypes_offset')==null)        
        Cookie.set('pricetypes_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('pricetypes_offset');
      if(Cookie.get('pricetypes_result')=='undefined' || Cookie.get('pricetypes_result')==null)        
        Cookie.set('pricetypes_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('pricetypes_result');
      
      //+++ getting base data from parent component
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');      

        this.fillOptionsList();//заполняем список опций фильтра
      this.getCompaniesList();// 
    }

// -------------------------------------- *** ПРАВА *** ------------------------------------
getSetOfPermissions(){
  return this.http.get('/api/auth/getMyPermissions?id=9')
          .subscribe(
              (data) => {   
                          this.permissionsSet=data as any [];
                          this.getMyId();
                      },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}});},
          );
}
getCRUD_rights(permissionsSet:any[]){
  this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==93)});
  this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==93)});
  this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==94)});
  this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==94)});
  this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==95)});
  this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==96)});
  this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==97)});
  this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==98)});
  this.getData();
}

refreshPermissions():boolean{
  this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany)?true:false;
  this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany)?true:false;
  this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany)?true:false;
  this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany)?true:false;
  this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
  console.log("allowToView - "+this.allowToView);
  console.log("allowToUpdate - "+this.allowToUpdate);
  console.log("allowToCreate - "+this.allowToCreate);
  console.log("allowToDelete - "+this.allowToDelete);
  console.log("allowToDeleteAllCompanies - "+this.allowToDeleteAllCompanies);
  return true;
}

getCompaniesList(){ //+++
  if(this.receivedCompaniesList.length==0)
    this.loadSpravService.getCompaniesList()
            .subscribe(
              (data) => {this.receivedCompaniesList=data as any [];
                this.getSetOfPermissions();
              },
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
          );
  else this.getSetOfPermissions();
}

getMyId(){ //+++
  if(+this.myId==0)
   this.loadSpravService.getMyId()
          .subscribe(
              (data) => {this.myId=data as any;
                this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
          );
    else this.getMyCompanyId();
}
getMyCompanyId(){ //+++
  if(+this.myCompanyId==0)
    this.loadSpravService.getMyCompanyId().subscribe(
    (data) => {
      this.myCompanyId=data as number;
      this.setDefaultCompany();
    }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
  else this.setDefaultCompany();
} 

setDefaultCompany(){
  if(Cookie.get('pricetypes_companyId')=='0'){
    this.sendingQueryForm.companyId=this.myCompanyId;
    Cookie.set('pricetypes_companyId',this.sendingQueryForm.companyId);
  }
  this.getCRUD_rights(this.permissionsSet);
}
getTableHeaderTitles(){
  this.displayedColumns=[];
  if(this.allowToDelete) this.displayedColumns.push('select');
  if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
  this.displayedColumns.push('name');
  this.displayedColumns.push('description');
  // this.displayedColumns.push('pricerole');
  this.displayedColumns.push('is_default');
  this.displayedColumns.push('creator');
  this.displayedColumns.push('date_time_created');
}
// -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
    getData(){
      if(this.refreshPermissions() && this.allowToView)
      {
        this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
        this.getTableHeaderTitles();
        this.getPagesList();
        this.getTable();
      //!!!
    } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})}
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
  getPagesList(){
    this.queryFormService.getPagesList(this.sendingQueryForm)
            .subscribe(
                data => {this.receivedPagesList=data as string [];
                this.size=this.receivedPagesList[0];
                this.pagenum=this.receivedPagesList[1];
                this.listsize=this.receivedPagesList[2];
                this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            ); 
  }

    getTable(){//!!!
      this.gettingTableData=true;
      this.queryFormService.getTable(this.sendingQueryForm)
        .subscribe(
            (data) => {
              this.dataSource.data = data as any []; 
              if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) 
                this.setPage(0);
              this.gettingTableData=false;
            },
            error => {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})} 
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
      console.log("1");
      for (var i = 0; i < this.dataSource.data.length; i++) {
        console.log("2");
        if(this.selection.isSelected(this.dataSource.data[i]))
        this.checkedList.push(this.dataSource.data[i].id);
      }
      if(this.checkedList.length>0){
        console.log("3");
          this.hideAllBtns();
          if(this.allowToDelete) this.visBtnDelete = true;
      }else{console.log("4");this.showOnlyVisBtnAdd()}
      console.log("checkedList - "+this.checkedList);
    }
  
    showCheckbox(row:CheckBox):boolean{
      if(!row.is_completed && (
        (this.allowToDeleteAllCompanies)||
        (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId))
        )return true; else return false;
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
    }
    
    setPage(value:any) // set pagination
    {
      this.clearCheckboxSelection();
      this.sendingQueryForm.offset=value;
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
        if(result==1){this.deleteDocs();}
        this.clearCheckboxSelection();
        this.showOnlyVisBtnAdd();
      });        
    }

    deleteDocs(){
      const body = {"checked": this.checkedList.join()}; 
      this.clearCheckboxSelection();
      this.checkedList=[];
          return this.http.post('/api/auth/deleteTypePrices', body) 
      .subscribe((data) => {   
        let result=data as any;
        switch(result){
          case 1:{this.getData();this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));break;}  //+++
        case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
        case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    }
      
    undeleteDocs(){
      const body = {"checked": this.checkedList.join()};
      this.clearCheckboxSelection();
      this.checkedList=[];
       return this.http.post('/api/auth/undeleteTypePrices', body) 
      .subscribe(
          (data) => {   
            let result=data as any;
            switch(result){
              case 1:{this.getData();this.openSnackBar(translate('menu.msg.rec_success'), translate('menu.msg.close'));break;}  //+++
            case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
            case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
            }
          },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},);
    }  

    getSpravSysPriceRole(){
      this.receivedSpravSysPriceRole=null;
      this.loadSpravService.getSpravSysPriceRole()
              .subscribe(
                  (data) => {this.receivedSpravSysPriceRole=data as any [];},
                  error => console.log(error)
              );
    }

    onClickRadioBtn(id:number, name:string){
      const body = {"id": this.sendingQueryForm.companyId, "id3":id}; 
      this.clearCheckboxSelection();
        return this.http.post('/api/auth/setDefaultPriceType', body) 
      .subscribe(
          (data) => {   
            this.getData();
                      this.openSnackBar(translate('menu.msg.pricetype_set',{name: name}), translate('menu.msg.close'));
                    },
          error => {this.openSnackBar(translate('menu.msg.ne_perm'), translate('menu.msg.close')); console.log(error);this.getData();},
      );
    }
    openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
        duration: 3000,
      });
    }
     //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  clickBtnRestore(): void {
    const dialogRef = this.confirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('menu.dialogs.restore'), //+++
        query: translate('menu.dialogs.q_restore'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.undeleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  resetOptions(){
    this.displayingDeletedDocs=false;
    this.fillOptionsList();//перезаполняем список опций
    this.selectionFilterOptions.clear();
    this.sendingQueryForm.filterOptionsIds = [];
  }
  fillOptionsList(){
    this.optionsIds=[{id:1, name: 'menu.top.only_del'},]; //+++
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
 
  getBaseData(data) {    //+++ emit data to parent component
    this.baseData.emit(data);
  }
}

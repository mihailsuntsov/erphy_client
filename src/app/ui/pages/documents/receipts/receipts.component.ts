import { Component, Inject, OnInit, Optional} from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { Validators } from '@angular/forms';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-receipts-table.service';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { FormGroup, FormControl } from '@angular/forms';
// import { SettingsReceiptsDialogComponent } from 'src/app/modules/settings/settings-receipts-dialog/settings-receipts-dialog.component';

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
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class ReceiptsComponent implements OnInit {
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
  shiftsKassaList:any[]; //загрузка списка касс
  shiftsCashiersList:any[]; //загрузка списка кассиров
  // shift_id:number=null;// номер смены
  mode: string = 'standart';  // режим работы документа: 

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

  gettingTableData:boolean=true;
  
  settingsForm: any; // форма с настройками

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
  displayingDeletedDocs:boolean = false;//true - режим отображения удалённых документов. false - неудалённых
  displaySelectOptions:boolean = true;// отображать ли кнопку "Выбрать опции для фильтра"
  //***********************************************************************************************************************/
  constructor(
    private activateRoute: ActivatedRoute,
    private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    private MessageDialog: MatDialog,
    public confirmDialog: MatDialog,
    private http: HttpClient,
    // private settingsReceiptsDialogComponent: MatDialog,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<ReceiptsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    //   if(activateRoute.snapshot.params['id'])
    //     this.shift_id = +activateRoute.snapshot.params['id'];
     }

    ngOnInit() {
      this.sendingQueryForm.companyId='0';
      this.sendingQueryForm.departmentId='0';
      this.sendingQueryForm.kassaId='0';
      this.sendingQueryForm.cashierId='0';
      this.sendingQueryForm.sortAsc='desc';
      this.sendingQueryForm.sortColumn='date_time_created_sort';
      this.sendingQueryForm.offset='0';
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.filterOptionsIds = [];

      if(Cookie.get('receipts_companyId')=='undefined' || Cookie.get('receipts_companyId')==null)     
        Cookie.set('receipts_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('receipts_companyId')=="0"?"0":+Cookie.get('receipts_companyId'));
      if(Cookie.get('receipts_departmentId')=='undefined' || Cookie.get('receipts_departmentId')==null)  
        Cookie.set('receipts_departmentId',this.sendingQueryForm.departmentId); else this.sendingQueryForm.departmentId=(Cookie.get('receipts_departmentId')=="0"?"0":+Cookie.get('receipts_departmentId'));
      if(Cookie.get('receipts_kassaId')=='undefined' || Cookie.get('receipts_kassaId')==null)  
        Cookie.set('receipts_kassaId',this.sendingQueryForm.kassaId); else this.sendingQueryForm.kassaId=(Cookie.get('receipts_kassaId')=="0"?"0":+Cookie.get('receipts_kassaId'));
      if(Cookie.get('receipts_cashierId')=='undefined' || Cookie.get('receipts_cashierId')==null)  
        Cookie.set('receipts_cashierId',this.sendingQueryForm.cashierId); else this.sendingQueryForm.cashierId=(Cookie.get('receipts_cashierId')=="0"?"0":+Cookie.get('receipts_cashierId'));
      if(Cookie.get('receipts_sortAsc')=='undefined' || Cookie.get('receipts_sortAsc')==null)       
        Cookie.set('receipts_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('receipts_sortAsc');
      if(Cookie.get('receipts_sortColumn')=='undefined' || Cookie.get('receipts_sortColumn')==null)    
        Cookie.set('receipts_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('receipts_sortColumn');
      if(Cookie.get('receipts_offset')=='undefined' || Cookie.get('receipts_offset')==null)        
        Cookie.set('receipts_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('receipts_offset');
      if(Cookie.get('receipts_result')=='undefined' || Cookie.get('receipts_result')==null)        
        Cookie.set('receipts_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('receipts_result');
      
      this.fillOptionsList();//заполняем список опций фильтра
      // Форма настроек
    /*this.settingsForm = new FormGroup({
      // id отделения
      departmentId: new FormControl             (null,[]),
      //покупатель по умолчанию
      cagentId: new FormControl                 (null,[]),
      //наименование покупателя
      cagent: new FormControl                   ('',[]),
      //наименование заказа по умолчанию
      name:  new FormControl                    ('',[]),
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
      //автосоздание нового документа, если все поля заполнены
      autocreate: new FormControl               (false,[]),
      //статус после успешного отбития чека, перед созданием нового документа
      statusIdOnComplete: new FormControl       ('',[]),
      // автодобавление товара в таблицу товаров
      autoAdd:  new FormControl                 (false,[]),
      // автовыставление цены (последняя закупочная цена)
      autoPrice:  new FormControl               (false,[]),
    });*/

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

      if(this.data)//если документ вызывается в окне из другого документа
      {
        this.mode=this.data.mode;
        if(this.mode=='viewInWindow'){
          this.sendingQueryForm.shift_id=this.data.docId;
          this.sendingQueryForm.companyId=this.data.companyId;
          this.sendingQueryForm.departmentId='0';
          this.sendingQueryForm.kassaId='0';
          this.sendingQueryForm.cashierId='0';
          this.sendingQueryForm.sortAsc='desc';
          this.sendingQueryForm.sortColumn='date_time_created_sort';
          this.sendingQueryForm.offset='0';
          this.sendingQueryForm.result='10';
        }
      } 
    }

    // -------------------------------------- *** ПРАВА *** ------------------------------------
   getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=44')
            .subscribe(
                (data) => {   
                            this.permissionsSet=data as any [];
                            this.getMyId();
                        },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
            );
  }


  getCRUD_rights(permissionsSet:any[]){
    // this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==425)});
    // this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==426)});
    // this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==427)});
    // this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==428)});
    // this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==429)});
    // this.allowToDeleteMyDepartments = permissionsSet.some(        function(e){return(e==430)});
    // this.allowToDeleteMyDocs = permissionsSet.some(               function(e){return(e==431)});
    this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==563)});
    this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==564)});
    this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==565)});
    // this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==435)});
    // this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==436)});
    // this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==437)});
    // this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==438)});
    // this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==439)});
    this.getData();
  }

  refreshPermissions():boolean{
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments/*||this.allowToViewMyDocs*/)?true:false;
    // this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToUpdateMyDepartments||this.allowToUpdateMyDocs)?true:false;
    // this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
    // this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany || this.allowToDeleteMyDepartments || this.allowToDeleteMyDocs)?true:false;
    // this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
    // this.visBtnAdd = (this.allowToCreate)?true:false;
    
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
      this.doFilterDepartmentsList();//если нет просмотра по своим отделениям - фильтруем список отделений предприятия до своих отделений
      this.getTableHeaderTitles();
      this.getTableAndPagesList();
      this.getShiftsKassa();
      this.getShiftsCashiers();
    } else {this.gettingTableData=false;;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Нет прав на просмотр"}})}
  }

  getTableAndPagesList(){
    this.getPagesList();
    this.getTable();
  }
  
  getTableHeaderTitles(){
    this.displayedColumns=[];
    // if(this.allowToDelete) this.displayedColumns.push('select');
    // if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');

    this.displayedColumns.push('company');
    this.displayedColumns.push('department');
    this.displayedColumns.push('kassa');
    this.displayedColumns.push('shift_number');
    this.displayedColumns.push('document');
    this.displayedColumns.push('operation_id');
    this.displayedColumns.push('date_time_created');
    this.displayedColumns.push('creator');
    this.displayedColumns.push('payment_type');
    this.displayedColumns.push('summ');
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            ); 
  }

  getTable(){
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
  getShiftsKassa(){
    this.http.get('/api/auth/getShiftsKassa?company_id='+this.sendingQueryForm.companyId+"&department_id="+(+this.sendingQueryForm.departmentId)+"&docName='receipts'")
      .subscribe(
          data => { 
            this.shiftsKassaList=data as any[];
            if(this.shiftsKassaList==null){
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка загрузки списка касс (ККМ)"}});
            } 
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }
  getShiftsCashiers(){
    this.http.get('/api/auth/getShiftsCashiers?company_id='+this.sendingQueryForm.companyId+"&department_id="+(+this.sendingQueryForm.departmentId)+"&docName='receipts'")
      .subscribe(
          data => { 
            this.shiftsCashiersList=data as any[];
            if(this.shiftsCashiersList==null){
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:"Ошибка загрузки списка кассиров"}});
            } 
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }
  onKassaSelection(){
    Cookie.set('receipts_kassaId',this.sendingQueryForm.kassaId);
    this.resetOptions();
    this.getTableAndPagesList();
  }
  onCashierSelection(){
    Cookie.set('receipts_cashierId',this.sendingQueryForm.cashierId);
    this.resetOptions();
    this.getTableAndPagesList();

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
        if(this.checkedList.length==1){this.visBtnCopy = true}
    }else{console.log("4");this.showOnlyVisBtnAdd()}
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
    Cookie.set('receipts_result',this.sendingQueryForm.result);
    this.getData();
  }

  setPage(value:any) // set pagination
  {
    this.clearCheckboxSelection();
    this.sendingQueryForm.offset=value;
    Cookie.set('receipts_offset',value);
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
      Cookie.set('receipts_sortAsc',this.sendingQueryForm.sortAsc);
      } else {
          this.sendingQueryForm.sortColumn=valueSortColumn;
          this.sendingQueryForm.sortAsc="desc";
          Cookie.set('receipts_sortAsc',"desc");
          Cookie.set('receipts_sortColumn',valueSortColumn);
      }
      this.getData();
  }
  
  onCompanySelection(){
    Cookie.set('receipts_companyId',this.sendingQueryForm.companyId);
    Cookie.set('receipts_departmentId','0');
    Cookie.set('receipts_kassaId','0');
    Cookie.set('receipts_cashierId','0');
    // console.log('receipts_companyId - '+Cookie.get('receipts_companyId'));
    // console.log('receipts_departmentId - '+Cookie.get('receipts_departmentId'));
    this.sendingQueryForm.departmentId="0"; 
    this.sendingQueryForm.kassaId="0"; 
    this.sendingQueryForm.cashierId="0"; 
    this.resetOptions();
    this.getDepartmentsList();
    this.getShiftsKassa();
    this.getShiftsCashiers();
  }

  onDepartmentSelection(){
    Cookie.set('receipts_departmentId',this.sendingQueryForm.departmentId);
    Cookie.set('receipts_kassaId','0');
    Cookie.set('receipts_cashierId','0');
    // console.log('receipts_companyId - '+Cookie.get('receipts_companyId'));
    // console.log('receipts_departmentId - '+Cookie.get('receipts_departmentId'));
    this.sendingQueryForm.kassaId="0"; 
    this.sendingQueryForm.cashierId="0"; 
    this.resetOptions();
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
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
          return this.http.post('/api/auth/deleteReceipts', body) 
  .subscribe((data) => {   
    let result=data as any;
    switch(result.result){
      case 0:{this.getData();this.openSnackBar("Успешно удалено", "Закрыть");break;} 
      case 1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:("В ходе удаления "+(this.checkedList.length>1?"документов":"документа")+" проиошла ошибка")}});break;}
      case 2:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Недостаточно прав для операции удаления"}});break;}
      case 3:{let numbers:string='';
        for(var i=0;i<result.docs.length;i++){numbers=numbers+' <a href="/ui/receiptsdoc/'+result.docs[i].id+'">'+result.docs[i].doc_number+'</a>';}
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:'Удаление невозможно - у следующих номеров документов есть производные (связанные с ними дочерние) документы:'+numbers}});break;}
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
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  getMyId(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyId()
            .subscribe(
                (data) => {this.myId=data as any;
                  this.getMyCompanyId();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }
  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.setDefaultCompany();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }

  setDefaultCompany(){
    if(Cookie.get('receipts_companyId')=='0'){
      this.sendingQueryForm.companyId=this.myCompanyId;
      Cookie.set('receipts_companyId',this.sendingQueryForm.companyId);
    }
      this.getDepartmentsList();
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(+this.sendingQueryForm.companyId,false)
            .subscribe(
                (data) => {this.receivedDepartmentsList=data as any [];
                            this.getMyDepartmentsList();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
            .subscribe(
                (data) => {this.receivedMyDepartmentsList=data as any [];
                  this.setDefaultDepartment();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );
  }

  setDefaultDepartment(){
    if(this.receivedDepartmentsList.length==1)
    {
      console.log('установка отделения по умолчанию - '+this.receivedDepartmentsList[0].id);

      this.sendingQueryForm.departmentId=+this.receivedDepartmentsList[0].id;
      Cookie.set('receipts_departmentId',this.sendingQueryForm.departmentId);
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
      //*************************************************************   НАСТРОЙКИ   ************************************************************/    
    // открывает диалог настроек
   /* openDialogSettings() { 
      const dialogSettings = this.settingsReceiptsDialogComponent.open(SettingsReceiptsDialogComponent, {
        maxWidth: '95vw',
        maxHeight: '95vh',
        // height: '680px',
        width: '400px', 
        minHeight: '650px',
        data:
        { //отправляем в диалог:
          receivedCompaniesList: this.receivedCompaniesList, //список предприятий
          receivedDepartmentsList: this.receivedDepartmentsList,//список отделений
          company_id: +this.sendingQueryForm.companyId, //предприятие (нужно для поиска покупателя)
          department_type_price_id: null,
          cagent_type_price_id: null,
          default_type_price_id: null,
          id: 0, //чтобы понять, новый док или уже созданный
        },
      });
      dialogSettings.afterClosed().subscribe(result => {
        if(result){
          //если нажата кнопка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
          if(result.get('companyId')) this.settingsForm.get('companyId').setValue(result.get('companyId').value);
          if(result.get('departmentId')) this.settingsForm.get('departmentId').setValue(result.get('departmentId').value);
          if(result.get('cagentId')) this.settingsForm.get('cagentId').setValue(result.get('cagentId').value);
          if(result.get('cagent')) this.settingsForm.get('cagent').setValue(result.get('cagent').value);
          this.settingsForm.get('autocreate').setValue(result.get('autocreate').value);
          this.settingsForm.get('name').setValue(result.get('name').value);
          this.settingsForm.get('statusIdOnComplete').setValue(result.get('statusIdOnComplete').value);
          this.settingsForm.get('autoAdd').setValue(result.get('autoAdd').value);
          this.settingsForm.get('autoPrice').setValue(result.get('autoPrice').value);
          this.saveSettingsReceipts();
        }
      });
    }
    // Сохраняет настройки
    saveSettingsReceipts(){
      return this.http.post('/api/auth/saveSettingsReceipts', this.settingsForm.value)
              .subscribe(
                  (data) => {   
                            this.openSnackBar("Настройки успешно сохранены", "Закрыть");
                            
                          },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
              );
    }*/
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  clickBtnRestore(): void {
    const dialogRef = this.confirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: 'Восстановление',
        query: 'Восстановить выбранные счета покупателям из удалённых?',
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){this.undeleteDocs();}
      this.clearCheckboxSelection();
      this.showOnlyVisBtnAdd();
    });        
  }
  undeleteDocs(){
    const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
    this.clearCheckboxSelection();
      return this.http.post('/api/auth/undeleteReceipts', body) 
    .subscribe(
        (data) => {   
                    this.getData();
                    this.openSnackBar("Успешно восстановлено", "Закрыть");
                  },
        error => console.log(error),
    );
  }  
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

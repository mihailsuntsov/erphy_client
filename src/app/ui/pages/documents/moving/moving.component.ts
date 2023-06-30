import { Component, EventEmitter, OnInit, Output} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-docs-table.service';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { SettingsMovingDialogComponent } from 'src/app/modules/settings/settings-moving-dialog/settings-moving-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { CommonUtilitesService } from '../../../../services/common_utilites.serviсe'; //+++
import { translate, TranslocoService } from '@ngneat/transloco'; //+++

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
interface idNameDescription{
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-moving',
  templateUrl: './moving.component.html',
  styleUrls: ['./moving.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService] //+++
})
export class MovingComponent implements OnInit {

  constructor(
    private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private confirmDialog: MatDialog,
    private http: HttpClient,
    private deleteDialog: MatDialog,
    private MessageDialog: MatDialog,
    private SettingsMovingDialogComponent: MatDialog,
    public cu: CommonUtilitesService, //+++
    private service: TranslocoService,
    ) { }

    sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
    receivedPagesList: string [] ;//массив для получения данных пагинации
    dataSource = new MatTableDataSource<CheckBox>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
    displayedColumns: string[] = [];//массив отображаемых столбцов таблицы
    selection = new SelectionModel<CheckBox>(true, []);// специальный класс для удобной работы с чекбоксами
    receivedCompaniesList: idAndName [] = [];//массив для получения списка предприятий
    receivedDepartmentsList: idAndName [] = [];//массив для получения списка отделений
    receivedMyDepartmentsList: idAndName [] = [];//массив для получения списка СВОИХ отделений
    myCompanyId:number=0;//
    myId:number=0;
    checkedList:number[]=[]; //строка для накапливания id чекбоксов вида [2,5,27...]
    settingsForm: any; // форма с настройками
    receivedPriceTypesList: idNameDescription [] = [];//массив для получения списка типов цен
  
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
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)
 
  
    ngOnInit() {
      this.sendingQueryForm.companyId=0;
      this.sendingQueryForm.departmentFromId=0;
      this.sendingQueryForm.departmentToId=0;
      this.sendingQueryForm.sortAsc='desc';
      this.sendingQueryForm.sortColumn='date_time_created_sort';
      this.sendingQueryForm.offset=0;
      this.sendingQueryForm.result='10';
      this.sendingQueryForm.searchCategoryString="";
      this.sendingQueryForm.filterOptionsIds = [];
  
      if(Cookie.get('moving_companyId')=='undefined' || Cookie.get('moving_companyId')==null)     
        Cookie.set('moving_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('moving_companyId')=="0"?"0":+Cookie.get('moving_companyId'));
      if(Cookie.get('moving_departmentFromId')=='undefined' || Cookie.get('moving_departmentFromId')==null)  
        Cookie.set('moving_departmentFromId',this.sendingQueryForm.departmentFromId); else this.sendingQueryForm.departmentFromId=(Cookie.get('moving_departmentFromId')=="0"?"0":+Cookie.get('moving_departmentFromId'));
      if(Cookie.get('moving_departmentToId')=='undefined' || Cookie.get('moving_departmentToId')==null)  
        Cookie.set('moving_departmentToId',this.sendingQueryForm.departmentToId); else this.sendingQueryForm.departmentToId=(Cookie.get('moving_departmentToId')=="0"?"0":+Cookie.get('moving_departmentToId'));
      if(Cookie.get('moving_sortAsc')=='undefined' || Cookie.get('moving_sortAsc')==null)       
        Cookie.set('moving_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('moving_sortAsc');
      if(Cookie.get('moving_sortColumn')=='undefined' || Cookie.get('moving_sortColumn')==null)    
        Cookie.set('moving_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('moving_sortColumn');
      if(Cookie.get('moving_offset')=='undefined' || Cookie.get('moving_offset')==null)        
        Cookie.set('moving_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('moving_offset');
      if(Cookie.get('moving_result')=='undefined' || Cookie.get('moving_result')==null)        
        Cookie.set('moving_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('moving_result');
    
      //+++ getting base data from parent component
      this.getBaseData('myId');    
      this.getBaseData('myCompanyId');  
      this.getBaseData('companiesList');      
      this.getBaseData('myDepartmentsList');
      
      this.fillOptionsList();//заполняем список опций фильтра
  
      // Форма настроек
      this.settingsForm = new UntypedFormGroup({
        // предприятие, для которого создаются настройки
        companyId: new UntypedFormControl                (null,[]),
        // id отделения из
        departmentFromId: new UntypedFormControl             (null,[]),
        // id отделения в
        departmentToId: new UntypedFormControl             (null,[]),
        // тип расценки. priceType - по типу цены, avgCostPrice - средн. себестоимость, lastPurchasePrice - Последняя закупочная цена, avgPurchasePrice - Средняя закупочная цена, manual - вручную
        pricingType: new UntypedFormControl              ('avgCostPrice',[]), // по умолчанию ставим "Средняя закупочная цена"
        // тип цены
        priceTypeId: new UntypedFormControl              (null,[]),
        // наценка или скидка. В чем выражается (валюта или проценты) - определяет changePriceType
        changePrice: new UntypedFormControl              (0,[Validators.pattern('^[0-9]{1,7}(?:[.,][0-9]{0,2})?\r?$')]), // по умолчанию "плюс 10%"
        // Наценка (plus) или скидка (minus)
        plusMinus: new UntypedFormControl                ('plus',[]),
        // выражение наценки (валюта или проценты): currency - валюта, procents - проценты
        changePriceType: new UntypedFormControl          ('procents',[]),
        // убрать десятые (копейки)
        hideTenths: new UntypedFormControl               (true,[]),
        // статус после завершения инвентаризации
        statusOnFinishId: new UntypedFormControl         ('',[]),
        // автодобавление товара из формы поиска в таблицу
        autoAdd:  new UntypedFormControl                 (false,[]),
      });
      
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
      return this.http.get('/api/auth/getMyPermissions?id=30')
            .subscribe(
                (data) => {   
          this.permissionsSet=data as any [];
          this.getMyId();
      },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
      );
    }
  
    getCRUD_rights(permissionsSet:any[]){
      this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==377)});
      this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==378)});
      this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==379)});
      this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==380)});
      this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==381)});
      this.allowToDeleteMyDepartments = permissionsSet.some(        function(e){return(e==382)});
      this.allowToDeleteMyDocs = permissionsSet.some(               function(e){return(e==383)});
      this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==384)});
      this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==385)});
      this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==386)});
      this.allowToViewMyDocs = permissionsSet.some(                 function(e){return(e==387)});
      this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==388)});
      this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==389)});
      this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==390)});
      this.allowToUpdateMyDocs = permissionsSet.some(               function(e){return(e==391)});
      this.getData();
    }
  
    refreshPermissions():boolean{
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
        this.doFilterCompaniesList(); //если нет просмотра по всем предприятиям - фильтруем список предприятий до своего предприятия
        this.doFilterDepartmentsList();//если нет просмотра по свому предприятию - фильтруем список отделений предприятия до своих отделений
        this.getTableHeaderTitles();
        this.getPagesList();
        this.getTable();
      } else {this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:translate('menu.msg.ne_perm')}})} //+++
    }  
  
    getTableHeaderTitles(){
      this.displayedColumns=[];
      if(this.allowToDelete) this.displayedColumns.push('select');
      if(this.showOpenDocIcon) this.displayedColumns.push('opendoc');
      this.displayedColumns.push('doc_number');
      this.displayedColumns.push('status');
      this.displayedColumns.push('product_count');
      this.displayedColumns.push('is_completed');
      //this.displayedColumns.push('company');
      this.displayedColumns.push('departmentFrom');
      this.displayedColumns.push('departmentTo');
      this.displayedColumns.push('creator');
      this.displayedColumns.push('date_time_created');
    }
  
    getPagesList(){
      this.queryFormService.getPagesList(this.sendingQueryForm)
              .subscribe(
                  data => {this.receivedPagesList=data as string [];
                  this.size=this.receivedPagesList[0];
                  this.pagenum=this.receivedPagesList[1];
                  this.listsize=this.receivedPagesList[2];
                  this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1])},
          error =>  {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
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
          error =>  {console.log(error);this.gettingTableData=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}  //+++
      );
    }
  
   
  
    /**                               ЧЕКБОКСЫ                                  */
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
      if(this.dataSource.data){//!!!
        this.checkedList = [];
        for (var i = 0; i < this.dataSource.data.length; i++) {
          if(this.selection.isSelected(this.dataSource.data[i]))
            this.checkedList.push(this.dataSource.data[i].id);
        }
        if(this.checkedList.length>0){
            this.hideAllBtns();
            if(this.allowToDelete) this.visBtnDelete = true;
            if(this.checkedList.length==1){this.visBtnCopy = true}
        }else{console.log("");this.showOnlyVisBtnAdd()}
      }
    }
    isAllSelected() {//все выбраны
      const numSelected = this.selection.selected.length;
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;//true если все строки выбраны
    }  
    isThereSelected() {//есть выбранные
      return this.selection.selected.length>0;
    } 
    showCheckbox(row:CheckBox):boolean{
      if(!row.is_completed && (
        (this.allowToDeleteAllCompanies)||
        (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId)||
        (this.allowToDeleteMyDepartments && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id))||
        (this.allowToDeleteMyDocs && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id) && row.creator_id==this.myId))
        )return true; else return false;
    }
    /**                              КОНЕЦ ЧЕКБОКСОВ                                  */
  
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
      Cookie.set('moving_result',this.sendingQueryForm.result);
      this.getData();
    }
  
    setPage(value:any) // set pagination
    {
      this.clearCheckboxSelection();
      this.sendingQueryForm.offset=value;
      Cookie.set('moving_offset',value);
      this.getData();
    }
  
    clearCheckboxSelection(){
      this.selection.clear(); 
      if(this.dataSource.data) //!!!
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
        Cookie.set('moving_sortAsc',this.sendingQueryForm.sortAsc);
        } else {
            this.sendingQueryForm.sortColumn=valueSortColumn;
            this.sendingQueryForm.sortAsc="asc";
            Cookie.set('moving_sortAsc',"asc");
            Cookie.set('moving_sortColumn',valueSortColumn);
        }
        this.getData();
    }
    onCompanySelection(){
      Cookie.set('moving_companyId',this.sendingQueryForm.companyId);
      Cookie.set('moving_departmentId','0');
      this.sendingQueryForm.departmentFromId=0; 
      this.sendingQueryForm.departmentToId=0; 
      this.resetOptions();
      this.getDepartmentsList();
    }
    onDepartmentFromSelection(){
      Cookie.set('moving_departmentFromId',this.sendingQueryForm.departmentFromId);
      this.resetOptions();
      this.getData();
    }
    onDepartmentToSelection(){
      Cookie.set('moving_departmentToId',this.sendingQueryForm.departmentToId);
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
    undeleteDocs(){
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/undeleteMoving', body) 
      .subscribe(
      (data) => {   
        let result=data as any;
        switch(result){ //+++
          case 1:{this.getData();this.openSnackBar(translate('menu.msg.rec_success'), translate('menu.msg.close'));break;}  //+++
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
    }  

    deleteDocs(){
      const body = {"checked": this.checkedList.join()}; //join переводит из массива в строку
      this.clearCheckboxSelection();
      return this.http.post('/api/auth/deleteMoving', body) 
                  .subscribe(
      (data) => {   
        let result=data as any;
        switch(result){ //+++
          case 1:{this.getData();this.openSnackBar(translate('menu.msg.del_success'), translate('menu.msg.close'));break;}  //+++
          case null:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:(translate('menu.msg.error_msg'))}});break;}
          case -1:{this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.attention'),message:translate('menu.msg.ne_perm')}});break;}
        }
      },error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},); //+++
    }  

    openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action, {
        duration: 3000,
      });
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
    getMyDepartmentsList(){ //+++
      if(this.receivedMyDepartmentsList.length==0)
        this.loadSpravService.getMyDepartmentsListByCompanyId(this.myCompanyId,false)
        .subscribe(
            (data) => {this.receivedMyDepartmentsList=data as any [];
              this.setDefaultDepartment();},
              error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})},
        );
        else this.setDefaultDepartment();
    }
  
    setDefaultCompany(){
      if(Cookie.get('moving_companyId')=='0'||!this.companyIdInList(Cookie.get('moving_companyId'))){
        this.sendingQueryForm.companyId=this.myCompanyId;
        Cookie.set('moving_companyId',this.sendingQueryForm.companyId);
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
    
    setDefaultDepartment(){
      if(this.receivedDepartmentsList.length==1)
      {
        this.sendingQueryForm.departmentFromId=+this.receivedDepartmentsList[0].id;
        this.sendingQueryForm.departmentToId=+this.receivedDepartmentsList[0].id;
        Cookie.set('moving_departmenFromtId',this.sendingQueryForm.departmentFromId);
        Cookie.set('moving_departmentToId',this.sendingQueryForm.departmentToId);
      }
    this.getCRUD_rights(this.permissionsSet);
    }
  
    inMyDepthsId(id:number):boolean{//проверяет, состоит ли присланный id в группе id отделений пользователя
      let inMyDepthsId:boolean = false;
      if(this.receivedMyDepartmentsList){//проверяем, т.к. может быть ".forEach of null", если выбираем не свое предприятие
        this.receivedMyDepartmentsList.forEach(myDepth =>{
          myDepth.id==id?inMyDepthsId=true:null;
        });
      }
    return inMyDepthsId;
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

    getBaseData(data) {    //+++ emit data to parent component
      this.baseData.emit(data);
    }

    //*************************************************************   НАСТРОЙКИ   ************************************************************/    
    // открывает диалог настроек
    openDialogSettings() { 
      const dialogSettings = this.SettingsMovingDialogComponent.open(SettingsMovingDialogComponent, {
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
          if(result.get('departmentFromId')) this.settingsForm.get('departmentFromId').setValue(result.get('departmentFromId').value);
          if(result.get('pricingType')) this.settingsForm.get('pricingType').setValue(result.get('pricingType').value);
          if(result.get('priceTypeId')) this.settingsForm.get('priceTypeId').setValue(result.get('priceTypeId').value);
          if(result.get('plusMinus')) this.settingsForm.get('plusMinus').setValue(result.get('plusMinus').value);
          if(result.get('changePrice')) this.settingsForm.get('changePrice').setValue(result.get('changePrice').value);
          if(result.get('changePriceType')) this.settingsForm.get('changePriceType').setValue(result.get('changePriceType').value);
          this.settingsForm.get('hideTenths').setValue(result.get('hideTenths').value);
          if(result.get('departmentToId')) this.settingsForm.get('departmentToId').setValue(result.get('departmentToId').value);
          this.settingsForm.get('statusOnFinishId').setValue(result.get('statusOnFinishId').value);
          this.settingsForm.get('autoAdd').setValue(result.get('autoAdd').value);
          this.saveSettingsMoving();
        }
      });
    }
    // Сохраняет настройки
    saveSettingsMoving(){
      return this.http.post('/api/auth/saveSettingsMoving', this.settingsForm.value)
              .subscribe(
                  (data) => {   
                            this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
                            
                          },
                  error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
              );
    }
  
  //***********************************************  Ф И Л Ь Т Р   О П Ц И Й   *******************************************/
  
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
    // sometimes in cookie "..._companyId" there value that not exists in list of companies. If it happens, company will be not selected and data not loaded until user select company manually
    companyIdInList(id:any):boolean{let r=false;this.receivedCompaniesList.forEach(c=>{if(+id==c.id) r=true});return r}
  }
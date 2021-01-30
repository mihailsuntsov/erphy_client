import { Component, OnInit} from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadSpravService } from '../../../../services/loadsprav';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { QueryFormService } from './get-table.service';
import { DeleteDialog } from 'src/app/ui/dialogs/deletedialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';

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
  selector: 'app-kassa',
  templateUrl: './kassa.component.html',
  styleUrls: ['./kassa.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie]
})
export class KassaComponent implements OnInit {

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

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToUpdateAllCompanies:boolean = false;
  allowToUpdateMyCompany:boolean = false;
  allowToUpdateMyDepartments:boolean = false;
  allowToCreateMyCompany:boolean = false;
  allowToCreateAllCompanies:boolean = false;
  allowToCreateMyDepartments:boolean = false;
  allowToDeleteMyCompany:boolean = false;
  allowToDeleteAllCompanies:boolean = false;
  allowToDeleteMyDepartments:boolean = false;
  allowToView:boolean = false;
  allowToUpdate:boolean = false;
  allowToCreate:boolean = false;
  allowToDelete:boolean = false;
  allowCategoryCreate:boolean = false;
  allowCategoryUpdate:boolean = false;
  allowCategoryDelete:boolean = false;

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

  constructor(
    private queryFormService:   QueryFormService,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    public universalCategoriesDialog: MatDialog,
    public ConfirmDialog: MatDialog,
    private http: HttpClient,
    private Cookie: Cookie,
    public deleteDialog: MatDialog,
    public dialogRef1: MatDialogRef<KassaComponent>,) { }

  ngOnInit(): void {
    this.sendingQueryForm.sortAsc="desc";
    this.sendingQueryForm.sortColumn="p.name";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="10";
    this.sendingQueryForm.companyId="0";
    this.sendingQueryForm.departmentId='0';
    this.sendingQueryForm.searchCategoryString="";
    this.sendingQueryForm.filterOptionsIds = [];
    if(Cookie.get('kassa_companyId')=='undefined' || Cookie.get('kassa_companyId')==null)     
    Cookie.set('kassa_companyId',this.sendingQueryForm.companyId); else this.sendingQueryForm.companyId=(Cookie.get('kassa_companyId')=="0"?"0":+Cookie.get('kassa_companyId'));
    if(Cookie.get('kassa_departmentId')=='undefined' || Cookie.get('kassa_departmentId')==null)  
      Cookie.set('kassa_departmentId',this.sendingQueryForm.departmentId); else this.sendingQueryForm.departmentId=(Cookie.get('kassa_departmentId')=="0"?"0":+Cookie.get('kassa_departmentId'));
    if(Cookie.get('kassa_sortAsc')=='undefined' || Cookie.get('kassa_sortAsc')==null)       
    Cookie.set('kassa_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('kassa_sortAsc');
    if(Cookie.get('kassa_sortColumn')=='undefined' || Cookie.get('kassa_sortColumn')==null)    
    Cookie.set('kassa_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('kassa_sortColumn');
    if(Cookie.get('kassa_offset')=='undefined' || Cookie.get('kassa_offset')==null)        
    Cookie.set('kassa_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('kassa_offset');
    if(Cookie.get('kassa_result')=='undefined' || Cookie.get('kassa_result')==null)        
    Cookie.set('kassa_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('kassa_result');

    this.fillOptionsList();//заполняем список опций фильтра
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
      const body = {"documentId": 24};//24= "Касса"
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
      this.allowToCreateAllCompanies = permissionsSet.some(         function(e){return(e==296)});
      this.allowToCreateMyCompany = permissionsSet.some(            function(e){return(e==297)});
      this.allowToCreateMyDepartments = permissionsSet.some(        function(e){return(e==298)});
      this.allowToDeleteAllCompanies = permissionsSet.some(         function(e){return(e==299)});
      this.allowToDeleteMyCompany = permissionsSet.some(            function(e){return(e==300)});
      this.allowToDeleteMyDepartments = permissionsSet.some(        function(e){return(e==301)});
      this.allowToViewAllCompanies = permissionsSet.some(           function(e){return(e==302)});
      this.allowToViewMyCompany = permissionsSet.some(              function(e){return(e==303)});
      this.allowToViewMyDepartments = permissionsSet.some(          function(e){return(e==304)});
      this.allowToUpdateAllCompanies = permissionsSet.some(         function(e){return(e==305)});
      this.allowToUpdateMyCompany = permissionsSet.some(            function(e){return(e==306)});
      this.allowToUpdateMyDepartments = permissionsSet.some(        function(e){return(e==307)});
      this.getData();
    }
  
    refreshPermissions():boolean{
      let documentOfMyCompany:boolean = (this.sendingQueryForm.companyId==this.myCompanyId);
      this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments)?true:false;
      this.allowToUpdate=(this.allowToUpdateAllCompanies||this.allowToUpdateMyCompany||this.allowToUpdateMyDepartments)?true:false;
      this.allowToCreate=(this.allowToCreateAllCompanies||this.allowToCreateMyCompany||this.allowToCreateMyDepartments)?true:false;
      this.allowToDelete=(this.allowToDeleteAllCompanies || this.allowToDeleteMyCompany || this.allowToDeleteMyDepartments)?true:false;
      this.showOpenDocIcon=(this.allowToUpdate||this.allowToView);
      this.visBtnAdd = (this.allowToCreate)?true:false;
      
      console.log("allowToView - "+this.allowToView);
      console.log("allowToUpdate - "+this.allowToUpdate);
      console.log("allowToCreate - "+this.allowToCreate);
      console.log("allowToDelete - "+this.allowToDelete);
      console.log("allowToDeleteAllCompanies - "+this.allowToDeleteAllCompanies);
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
      this.displayedColumns.push('name');
      this.displayedColumns.push('company');
      this.displayedColumns.push('department');
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
    isAllSelected() {//все выбраны
      const numSelected = this.selection.selected.length;
      const numRows = this.dataSource.data.length;
      return  numSelected === numRows;//true если все строки выбраны
    }  
    isThereSelected() {//есть выбранные
      return this.selection.selected.length>0;
    } 
    showCheckbox(row:CheckBox):boolean{
      if(
          (this.allowToDeleteAllCompanies)||
          (this.allowToDeleteMyCompany && row.company_id==this.myCompanyId)||
          (this.allowToDeleteMyDepartments && row.company_id==this.myCompanyId && this.inMyDepthsId(row.department_id))
        )
        return true; else return false;
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
      Cookie.set('kassa_result',this.sendingQueryForm.result);
      this.getData();
    }
  
    setPage(value:any) // set pagination
    {
      this.clearCheckboxSelection();
      this.sendingQueryForm.offset=value;
      Cookie.set('kassa_offset',value);
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
        Cookie.set('kassa_sortAsc',this.sendingQueryForm.sortAsc);
        } else {
            this.sendingQueryForm.sortColumn=valueSortColumn;
            this.sendingQueryForm.sortAsc="asc";
            Cookie.set('kassa_sortAsc',"asc");
            Cookie.set('kassa_sortColumn',valueSortColumn);
        }
        this.getData();
    }
    onCompanySelection(){
      Cookie.set('kassa_companyId',this.sendingQueryForm.companyId);
      Cookie.set('kassa_departmentId','0');
      this.sendingQueryForm.departmentId="0"; 
      this.sendingQueryForm.offset=0;
      this.resetOptions();
      this.getDepartmentsList();
    }

    onDepartmentSelection(){
      Cookie.set('kassa_departmentId',this.sendingQueryForm.departmentId);
      this.resetOptions();
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
            return this.http.post('/api/auth/deleteKassa', body) 
              .subscribe(
                  (data) => {   
                              this.getData();
                            },
                  error => console.log(error),
              );
    }
    clickBtnRestore(): void {
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Восстановление',
          query: 'Восстановить выбранные кассы из удалённых?',
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
      return this.http.post('/api/auth/undeleteKassa', body) 
      .subscribe(
          (data) => {   
                      this.getData();
                      this.openSnackBar("Успешно восстановлено", "Закрыть");
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
      if(Cookie.get('kassa_companyId')=='0'){
        this.sendingQueryForm.companyId=this.myCompanyId;
        Cookie.set('kassa_companyId',this.sendingQueryForm.companyId);
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
        Cookie.set('kassa_departmentId',this.sendingQueryForm.departmentId);
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
      if( (!this.allowToViewAllCompanies && !this.allowToViewMyCompany && this.allowToViewMyDepartments)
      // ||(!this.allowToViewAllCompanies && !this.allowToViewMyCompany && !this.allowToViewMyDepartments && this.allowToViewMyDocs)
      ){
        this.receivedDepartmentsList=this.receivedMyDepartmentsList;}
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

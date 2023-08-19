import { Component, Input, OnInit } from '@angular/core';
import { QueryForm } from './query-form';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommonUtilitesService } from '../../../services/common_utilites.serviсe'; //+++
import { LoadSpravService } from './loadsprav';
import { QueryFormService } from './get-remains-table.service';
import { Cookie } from 'ng2-cookies/ng2-cookies';
// import { translate } from '@ngneat/transloco'; //+++

export interface DocTable {
  id: number;
}
export interface TableAndPagesData {//для получения в одном объекте и номеров страниц для пагинации, и самих данных для таблицы
  receivedPagesList: number[];
  table: any[];
}

export interface NumRow {//интерфейс для списка количества строк
  value: string;
  viewValue: string;
}
interface idAndName{ //универсалный интерфейс для выбора из справочников
  id: number;
  name: string;
}
@Component({
  selector: 'app-remains-vidget',
  templateUrl: './remains.component.html',
  styleUrls: ['./remains.component.css'],
  providers: [QueryFormService,LoadSpravService,Cookie,CommonUtilitesService]
})
export class RemainsComponent implements OnInit {
  sendingQueryForm: QueryForm=new QueryForm(); // интерфейс отправляемых данных по формированию таблицы (кол-во строк, страница, поисковая строка, колонка сортировки, asc/desc)
  receivedPagesList: string [];//массив для получения данных пагинации
  receivedMatTable: DocTable [] = [] ;//массив для получения данных для материал таблицы
  dataSource = new MatTableDataSource<DocTable>(this.receivedMatTable); //источник данных для материал таблицы
  displayedColumns: string[]=[];//массив отображаемых столбцов таблицы
  selection = new SelectionModel<DocTable>(true, []);//Class to be used to power selecting one or more options from a list.
  selectionFilterOptions = new SelectionModel<idAndName>(true, []);//Class to be used to power selecting one or more options from a list.
  completedStartQueries:number=0;
  showSettingsForm = false;
  departmentsList: idAndName[] = []; // массив отделений, разрешенных к выбору для отчета (это могут быть как все отделения предприятия, так и отделения предприятия, к которым приписан пользователь, в зависимости от прав)

  //переменные прав
  allowToViewAllCompanies:boolean = false;
  allowToViewMyCompany:boolean = false;
  allowToViewMyDepartments:boolean = false;
  allowToView:boolean = false;

  showOpenDocIcon:boolean=false;

  numRows: NumRow[] = [
    {value: '5', viewValue: '5'},
    {value: '10', viewValue: '10'},
    {value: '25', viewValue: '25'},
    {value: '50', viewValue: '50'},
    {value: '100', viewValue: '100'},
  ];
  
  //переменные пагинации
  size: any;
  pagenum: any;  // - Страница, которая сейчас выбрана в пагинаторе
  maxpage: any;  // - Последняя страница в пагинаторe (т.е. maxpage=8 при пагинаторе [345678])
  listsize: any; // - Последняя страница в пагинации (но не в пагинаторе. т.е. в пагинаторе может быть [12345] а listsize =10)

  // опции для фильтра
  optionsIds: idAndName [] = [
                              {id:3, name:'menu.top.hide_nonbuy'},
                              {id:4, name:'menu.top.hide_selloff'},
                              {id:0, name:'menu.top.not_available'},
                              {id:1, name:'menu.top.few'},
                              {id:2, name:'menu.top.enough'}                             
                            ]//список опций для вывода во всплывающем меню опций для фильтра
  checkedOptionsList:number[]=[]; //массив для накапливания id выбранных опций чекбоксов вида [2,5,27...], а так же для заполнения загруженными значениями чекбоксов
  
  @Input() companyId: number;                       // id предприятия, для которого запрашиваем данные
  @Input() myCompanyId: number;                     // id своего предприятия, для которого запрашиваем данные
  @Input() permissionsSet: any[];                   // сет прав на документ
  @Input() receivedDepartmentsList: idAndName[];    // массив всех отделений предприятия
  @Input() receivedMyDepartmentsList: idAndName[];  // массив своих отделений предприятия

  constructor(private queryFormService:   QueryFormService,
    private _snackBar: MatSnackBar,
    public productCategoriesDialog: MatDialog,
    public remainsDialogComponent: MatDialog,
    public cu: CommonUtilitesService, //+++
    public ConfirmDialog: MatDialog,
    public ProductDuplicateDialog: MatDialog,
    public deleteDialog: MatDialog) { 
    }
      
  ngOnInit() {
    this.sendingQueryForm.sortAsc="asc";
    this.sendingQueryForm.sortColumn="estimate_quantity";
    this.sendingQueryForm.offset=0;
    this.sendingQueryForm.result="5";
    this.sendingQueryForm.companyId="0";
    this.sendingQueryForm.departmentId="0";
    this.sendingQueryForm.cagentId="0";
    this.sendingQueryForm.selectedNodeId="0";
    this.sendingQueryForm.searchCategoryString="";

    if(Cookie.get('remains_departmentId')=='undefined' || Cookie.get('remains_departmentId')==null)  
      Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId); else this.sendingQueryForm.departmentId=(Cookie.get('remains_departmentId')=="0"?"0":+Cookie.get('remains_departmentId'));
    if(Cookie.get('remains_sortAsc')=='undefined' || Cookie.get('remains_sortAsc')==null)       
      Cookie.set('remains_sortAsc',this.sendingQueryForm.sortAsc); else this.sendingQueryForm.sortAsc=Cookie.get('remains_sortAsc');
    if(Cookie.get('remains_sortColumn')=='undefined' || Cookie.get('remains_sortColumn')==null)    
      Cookie.set('remains_sortColumn',this.sendingQueryForm.sortColumn); else this.sendingQueryForm.sortColumn=Cookie.get('remains_sortColumn');
    if(Cookie.get('remains_offset')=='undefined' || Cookie.get('remains_offset')==null)        
      Cookie.set('remains_offset',this.sendingQueryForm.offset); else this.sendingQueryForm.offset=Cookie.get('remains_offset');
    if(Cookie.get('remains_result')=='undefined' || Cookie.get('remains_result')==null)        
      Cookie.set('remains_result',this.sendingQueryForm.result); else this.sendingQueryForm.result=Cookie.get('remains_result');
    this.optionsIds.forEach(z=>{this.selectionFilterOptions.select(z);this.checkedOptionsList.push(+z.id);});//включаем все чекбоксы в фильтре, и заполняем ими список для отправки запроса
     
  }
  onStart(){
    this.sendingQueryForm.companyId=this.companyId;
    this.departmentsList=[];

    this.getSetOfPermissions();
    this.onStartQueries();
  }

  //2я группа параллельных стартовых запросов
  onStartQueries(){
    this.completedStartQueries++;
    if(this.allowToView){
      // console.log("Все стартовые запросы 1 выполнены!");
      this.completedStartQueries=0;
      this.getTableHeaderTitles();
      
      this.determineDepartmentsList();    
      this.getTable();
    }
  }  

  // -------------------------------------- *** ПРАВА *** ------------------------------------
  getSetOfPermissions(){
    this.allowToViewAllCompanies =  this.permissionsSet.some(          function(e){return(e==606)});
    this.allowToViewMyCompany =     this.permissionsSet.some(          function(e){return(e==607)});
    this.allowToViewMyDepartments = this.permissionsSet.some(          function(e){return(e==608)});
    this.allowToView=(this.allowToViewAllCompanies||this.allowToViewMyCompany||this.allowToViewMyDepartments)?true:false;
  }
  // -------------------------------------- *** КОНЕЦ ПРАВ *** ------------------------------------
  getTableHeaderTitles(){
    this.displayedColumns=[];
    this.displayedColumns.push('name');
    this.displayedColumns.push('article');
    this.checkedOptionsList.some(function(e){return(e==3)})?null:this.displayedColumns.push('not_buy');
    this.checkedOptionsList.some(function(e){return(e==4)})?null:this.displayedColumns.push('not_sell');
    this.displayedColumns.push('quantity');
    this.displayedColumns.push('min_quantity');
    this.displayedColumns.push('estimate_quantity');
  }

  getTable(){
    let dataObjectArray: any;
    this.sendingQueryForm.filterOptionsIds=this.checkedOptionsList;
    //здесь ↓ надо будет сделать в зависимости от прав - слать только свои отделения или все отделения предприятия
    this.sendingQueryForm.departmentsIdsList=JSON.stringify(this.getIds(this.departmentsList)).replace("[", "").replace("]", "");
    this.queryFormService.getTable(this.sendingQueryForm)
      .subscribe(
          (data) => {
            dataObjectArray=data as TableAndPagesData; 
            this.receivedMatTable=dataObjectArray.table;
            this.dataSource.data = this.receivedMatTable;
            if(this.dataSource.data.length==0 && +this.sendingQueryForm.offset>0) this.setPage(0);
            this.receivedPagesList=dataObjectArray.receivedPagesList;
            this.size=this.receivedPagesList[0];
            this.pagenum=this.receivedPagesList[1];
            this.listsize=this.receivedPagesList[2];
            this.maxpage=(this.receivedPagesList[this.receivedPagesList.length-1]);
          },
          error => {console.log(error);
            if(+this.sendingQueryForm.offset>0) this.setPage(0);
          }
      );
  }

  getIds(mass: any[]):number[]{
    let result:number[]=[];
    mass.forEach(element => {result.push(+element.id);});
    return result;
  }

  //определяет, на какой из списков отделений (все отделения предприятия или только пользователя) пользователь имеет право
  determineDepartmentsList(){
    //если разрешен просмотр по всем предприятиям, или по своему предприятию и мое предприятие = тому предприятию, чьи отделения переданы в данный модуль
    if(this.allowToViewAllCompanies || (this.allowToViewMyCompany && this.companyId==this.myCompanyId)){
      this.fillDepartmentsList(this.receivedDepartmentsList); //имеем доступ к просмотру отчета по всем отделениям текущего предприятия
    } else if(this.allowToViewMyDepartments){ //иначе если есть право на свои отделения - имеем доступ к просмотру отчета по своим отделениям
      this.fillDepartmentsList(this.receivedMyDepartmentsList);
    }  //иначе не имеем прав вообще, и departmentsList будет пуст. Соответственно, не загрузятся и сами данные. 
  }

  //заполняет список отделений разрешенными по правам отделениями
  fillDepartmentsList(list: idAndName[]){
    if(list)
      list.map(i => {
        this.departmentsList.push({id:i.id,name:i.name});
      });
    this.checkSelectedDepartment();
  }

  checkSelectedDepartment(){
    // если выбранный ранее отделение не в списке отделений
    if(+this.sendingQueryForm.departmentId>0 && !this.isDepartmentInList(+this.sendingQueryForm.departmentId)){
      // если отделений более 1
      if(this.departmentsList.length>1){
      // выбираем "Все отделения"
        this.sendingQueryForm.departmentId="0";
      }
      else{ // если == 1
      // выбираем его id 
        this.sendingQueryForm.departmentId=this.departmentsList[0].id.toString();
      }
      Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId);
    }
      
  }

  isDepartmentInList(depId:number):boolean{
    let inList:boolean=false;
    if(this.departmentsList) 
      this.departmentsList.map(i=>{if(i.id==depId) inList=true;});
    return inList;
  }

  onDepartmentSelection(){
    Cookie.set('remains_departmentId',this.sendingQueryForm.departmentId);
    this.getTable();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;//true если все строки выбраны
  }  
  
  setNumOfPages(){
    this.sendingQueryForm.offset=0;
    Cookie.set('remains_result',this.sendingQueryForm.result);
    this.getTableHeaderTitles();
    this.getTable();
  }
  
  setPage(value:any) // set pagination
  {
    this.sendingQueryForm.offset=value;
    Cookie.set('remains_offset',value);
    this.getTable();
  }

  setSort(valueSortColumn:any) // set sorting column
  {
    if(valueSortColumn==this.sendingQueryForm.sortColumn){// если колонка, на которую ткнули, та же, по которой уже сейчас идет сортировка
        if(this.sendingQueryForm.sortAsc=="asc"){
            this.sendingQueryForm.sortAsc="desc"
        } else {  
            this.sendingQueryForm.sortAsc="asc"
        }
        Cookie.set('remains_sortAsc',this.sendingQueryForm.sortAsc);
    } else {
        this.sendingQueryForm.sortColumn=valueSortColumn;
        this.sendingQueryForm.sortAsc="asc";
        Cookie.set('remains_sortAsc',"asc");
        Cookie.set('remains_sortColumn',valueSortColumn);
    }
    this.getTable();
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  
  clickFilterOptionsCheckbox(row){
    this.selectionFilterOptions.toggle(row); 
    this.createFilterOptionsCheckedList();
  } 

  createFilterOptionsCheckedList(){//checkedChangesList - массив c id выбранных чекбоксов вида "7,5,1,3,6,2,4", который заполняется при загрузке страницы и при нажатии на чекбокс, а при 
    this.checkedOptionsList = [];//                                                       отправке данных внедряется в поле формы selectedUserGroupPermissions
    console.log("createCheckedList!!!");
    this.optionsIds.forEach(z=>{
      console.log("object z - "+z+", z.id - "+z.id+", z.name - "+z.name)
      if(this.selectionFilterOptions.isSelected(z))
        this.checkedOptionsList.push(+z.id);
    })
  }

  onClickMenuIcon(){
    this.showSettingsForm = !this.showSettingsForm;
  }
}
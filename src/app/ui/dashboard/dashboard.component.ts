import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { SalesOnPeriodComponent } from 'src/app/modules/info-modules/sales-on-period/sales-on-period.component';
import { IncomeOutcomeComponent } from 'src/app/modules/info-modules/income-outcome/income-outcome.component';
import { IndicatorsLeftComponent } from 'src/app/modules/info-modules/indicators-left/indicators-left.component';
import { RemainsComponent } from 'src/app/modules/info-modules/remains/remains.component';
import { OpexComponent } from 'src/app/modules/info-modules/opex/opex.component';
import { SettingsDashboardComponent } from 'src/app/modules/settings/settings-dashboard/settings-dashboard.component'
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl } from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { LoadSpravService } from 'src/app/services/loadsprav';
import { translate } from '@ngneat/transloco'; //+++



// import { Cookie } from 'ng2-cookies/ng2-cookies';



export interface IdAndName {
  id: number;
  name:string;
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [SalesOnPeriodComponent,LoadSpravService,]
})
export class DashboardComponent implements OnInit {

  @ViewChild(SalesOnPeriodComponent,  {static: false}) public salesOnPeriodComponent:SalesOnPeriodComponent; // блок продаж по периодам 
  @ViewChild(IncomeOutcomeComponent,  {static: false}) public incomeOutcomeComponent:IncomeOutcomeComponent; // блок Остаток (приход-расход) 
  @ViewChild(IndicatorsLeftComponent, {static: false}) public indicatorsLeftComponent:IndicatorsLeftComponent; // карточки - информеры вверху страницы
  @ViewChild(RemainsComponent,        {static: false}) public remainsComponent:RemainsComponent; // остатки товаров
  @ViewChild(OpexComponent,           {static: false}) public opexComponent:OpexComponent; // операционные расходы
  @Output() baseData: EventEmitter<any> = new EventEmitter(); //+++ for get base datа from parent component (like myId, myCompanyId etc)

  constructor(
    private settingsDashboardComponent: MatDialog,
    private _snackBar: MatSnackBar,
    private http: HttpClient,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
  ) { }

  settingsForm: any; // форма с настройками
  receivedCompaniesList: IdAndName [] = [];//массив для получения списка предприятий
  myCompanyId:number; // id предприятия пользователя
  companyId:number; // id предприятия (для master-аккаунта может отличаться от myCompanyId, т.к. к нему может быть привязано несколько предприятий)  
  receivedDepartmentsList: IdAndName [] = [];//массив для получения списка отделений
  receivedMyDepartmentsList: IdAndName [] = [];//массив для получения списка своих отделений в своем предприятии
  onSaveSettings: boolean = false;
  canGetChilds: boolean=false; //можно ли грузить дочерние модули
  actionsBeforeGetChilds:number=0;// количество выполненных действий, необходимых чтобы загрузить дочерние модули (кассу и форму товаров)

  //переменные прав
  permissionsSet: any[];//сет прав на документ
  allowToDashboard: boolean = false; // показывать всю стартовую страницу
  allowToVolumes: boolean = false; // показывать плагин "Объёмы"
  allowToRemains: boolean = false; // показывать плагин "Остатки по скаладам"
  allowToOpex: boolean = false; // показывать плагин "Операционные расходы"
  allowToIncomeOutcome: boolean = false; // показывать плагин "Остаток"
  allowToViewAllCompanies:boolean = false;  //Возможность построения виджетов по всем предприятиям (true если хотя бы у одного виджета есть право на просмотр по всем предприятиям)


  ngOnInit(): void {
    // Форма настроек
    this.settingsForm = new FormGroup({
      //предприятие, для которого создаются настройки
      companyId: new FormControl                (null,[]),
    });

    this.getMyCompanyId();
    //  |
    //  getSettings
    //  |
    //  setSettingsValues
    //  |
    //  getSetOfPermissions
    //  |
    //  getCRUD_rights, checkToViewAllCompanies 
    //  |
    //  getMyDepartmentsList
    //  |
    //  getDepartmentsList
    //  |
    // +  this.vidgetsReload (если не на старте, а на сохранении настроек)

  }
//нужно загруить всю необходимую информацию, прежде чем вызывать детей (Поиск и добавление товара, Кассовый модуль), иначе их ngOnInit выполнится быстрее, чем загрузится вся информация в родителе
  //вызовы из:
  //getCRUD_rights() (загрузятся myCompanyId и настройки с companyId, права)
  //getDepartmentsList() (загрузятся предприятия и мои предприятия)
  necessaryActionsBeforeGetChilds(){
    this.actionsBeforeGetChilds++;
    //Если набрано необходимое кол-во действий для отображения модуля Формы поиска и добавления товара
    if(this.actionsBeforeGetChilds==2){
      // this.canGetChilds=true;
      this.vidgetsReload();
    }
  }

  getMyCompanyId(){
    this.loadSpravService.getMyCompanyId().subscribe(
      (data) => {
        this.myCompanyId=data as number;
        this.getSettings();
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})});
  }

  //загрузка настроек
  getSettings(){
    let result:any;
    this.http.get('/api/auth/getSettingsDashboard')
      .subscribe(
          data => { 
            result=data as any;
            //вставляем настройки в форму настроек
            this.settingsForm.get('companyId').setValue(result.companyId);
            //Устанавливаем значения из настроек
            this.setSettingsValues();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
      );
  }

  setSettingsValues(): void {
    //если в настройках нет id предприятия - ставим базовое id предприятия
    if(+this.settingsForm.get('companyId').value==0)
      this.companyId=this.myCompanyId;
    // иначе - id предприятия из настроек  
    else
      this.companyId=this.settingsForm.get('companyId').value
    this. getSetOfPermissions();
  }

  getSetOfPermissions(){
    return this.http.get('/api/auth/getMyPermissions?id=26')
      .subscribe(
          (data) => {   
                      this.permissionsSet=data as any [];
                      this.getCRUD_rights(this.permissionsSet);
                      this.checkToViewAllCompanies();
                      this.getMyDepartmentsList();
                    
                  },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
  }

  getCRUD_rights(permissionsSet:any[]){
    this.allowToDashboard =     permissionsSet.some(function(e){return(e==324)});
    this.allowToVolumes =       permissionsSet.some(function(e){return(e==325)}) || permissionsSet.some(function(e){return(e==326)}) || permissionsSet.some(function(e){return(e==327)});
    this.allowToIncomeOutcome = permissionsSet.some(function(e){return(e==325)}) || permissionsSet.some(function(e){return(e==326)}) || permissionsSet.some(function(e){return(e==327)});
    this.allowToRemains       = permissionsSet.some(function(e){return(e==606)}) || permissionsSet.some(function(e){return(e==607)}) || permissionsSet.some(function(e){return(e==608)});
    this.allowToOpex          = permissionsSet.some(function(e){return(e==609)}) || permissionsSet.some(function(e){return(e==610)});
    
    // Если ни у одного виджета не будет права на "Просмотр по всем предприятиям", а в настройках выбрано не своё предприятие
    // то нужно сменить текущее предприятие из настроек на своё, иначе абсолютно все виджеты будут пустые
    this.allowToViewAllCompanies = this.permissionsSet.some(         function(e){return(e==325)}) 
    ||this.permissionsSet.some(         function(e){return(e==592)}) 
    ||this.permissionsSet.some(         function(e){return(e==594)}) 
    ||this.permissionsSet.some(         function(e){return(e==596)}) 
    ||this.permissionsSet.some(         function(e){return(e==598)}) 
    ||this.permissionsSet.some(         function(e){return(e==600)}) 
    ||this.permissionsSet.some(         function(e){return(e==602)}) 
    ||this.permissionsSet.some(         function(e){return(e==604)})     
    ||this.permissionsSet.some(         function(e){return(e==606)})     
    ||this.permissionsSet.some(         function(e){return(e==609)});
    // console.log("allowToDashboard - "+this.allowToDashboard);
    // console.log("allowToVolumes - "+this.allowToVolumes);
    this.necessaryActionsBeforeGetChilds();
  }

  checkToViewAllCompanies(){
    // Если нельзя "Просмотр по всем предприятиям" ни в одном виджете стартовой страницы, и выбранное в настройках стартовой страницы предприятие не является предприятием пользователя 
    // (такое может быть, если пользователь в одном из виджетов был наделен правами на "Просмотр по всем предприятиям", а потом его лишили этих прав)
    // то нужно переключить предприятие на своё
    if(!this.allowToViewAllCompanies && this.companyId!=this.myCompanyId){
      this.companyId=this.myCompanyId;
    }
  }

  getMyDepartmentsList(){
    this.receivedMyDepartmentsList=null;
    this.loadSpravService.getMyDepartmentsListByCompanyId(this.companyId,false)
            .subscribe(
                (data) => {
                  this.receivedMyDepartmentsList=[];//для того, чтобы виджеты "заметили" изменение по этому массиву, и получили его (они реагируют только на изменение длины массива, но не на его содержание)
                  this.receivedMyDepartmentsList=data as IdAndName [];
                  this.getDepartmentsList();},
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }

  getDepartmentsList(){
    this.receivedDepartmentsList=null;
    this.loadSpravService.getDepartmentsListByCompanyId(this.companyId,false)
            .subscribe(
                (data) => {
                  this.receivedDepartmentsList=[];//для того, чтобы виджеты "заметили" изменение по этому массиву, и получили его (они реагируют только на изменение длины массива, но не на его содержание)
                  this.receivedDepartmentsList=data as IdAndName [];
                  
                  //если вся цепочка методов выполнялась не на старте, а на сохранении настроек, необходимо перезапустить виджеты Стартовой страницы
                  if(this.onSaveSettings){
                    this.vidgetsReload();
                    this.onSaveSettings=false;
                  }
                  this.necessaryActionsBeforeGetChilds();
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
            );
  }

  //перезапуск виджетов Стартовой страницы
  vidgetsReload(){    
    setTimeout(() => { // без этого @Input's у детей не успевают прогружаться, в частности, receivedDepartmentsList
      if(this.salesOnPeriodComponent) this.salesOnPeriodComponent.onStart();
      if(this.incomeOutcomeComponent) this.incomeOutcomeComponent.onStart();
      if(this.indicatorsLeftComponent) this.indicatorsLeftComponent.onStart();
      if(this.remainsComponent) this.remainsComponent.onStart();
      if(this.opexComponent) this.opexComponent.onStart();
    }, 1);
    
  }

  openDialogSettings(){
    const dialogSettings = this.settingsDashboardComponent.open(SettingsDashboardComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      width: '400px', 
      minHeight: '650px',
      data:
      { //отправляем в диалог:
        receivedCompaniesList: this.receivedCompaniesList, //список предприятий
        permissionsSet: this.permissionsSet, //набор прав стартовой страницы
        myCompanyId: this.myCompanyId, //предприятие пользователя
      },
    });
    dialogSettings.afterClosed().subscribe(result => {
      if(result){
        //если нажата кнопка Сохранить настройки - вставляем настройки в форму настроек и сохраняем
        if(result.get('companyId')) 
          this.settingsForm.get('companyId').setValue(result.get('companyId').value);

          this.saveSettingsDashboard();
      }
    });
  }

  saveSettingsDashboard(){
    return this.http.post('/api/auth/saveSettingsDashboard', this.settingsForm.value)
    .subscribe(
      (data) => {   
                this.openSnackBar(translate('docs.msg.settngs_saved'), translate('docs.msg.close'));
                //после сохранения  - устанавливаем новые настройки (применяем)
                this.onSaveSettings = true; //настройки были подвержены изменениям. Значит, в конце всей заново запущенной setSettingsValues цепочки методов выполнится перезапуск всех виджетов (метод vidgetsReload())
                this.setSettingsValues();
              },
      error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
    );
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }


}

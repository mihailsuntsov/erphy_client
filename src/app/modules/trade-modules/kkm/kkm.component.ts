import { ChangeDetectorRef, ViewChild, Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { KkmAtolService } from 'src/app/services/kkm_atol';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { FormGroup, FormArray,  FormBuilder,  Validators, FormControl } from '@angular/forms';
import { KkmAtolChequesService } from 'src/app/services/kkm_atol_cheques';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadSpravService } from 'src/app/services/loadsprav';
import { HttpClient } from '@angular/common/http';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';
const moment = _rollupMoment || _moment;
moment.defaultFormat = "DD.MM.YYYY";
moment.fn.toJSON = function() { return this.format('DD.MM.YYYY'); }
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
interface CustomersOrdersProductTable { //интерфейс для формы, массив из которых будет содержать форма customersOrdersProductTable, входящая в formBaseInformation, которая будет включаться в formBaseInformation
  id: number;
  row_id: number;
  product_id: number;
  customers_orders_id:number;
  name: string;
  product_count: number;
  edizm: string;
  edizm_id: number;
  product_price: number;
  product_price_of_type_price: number;//цена товара по типу цены. Т.к. цену можно редактировать в таблице товаров, при несовпадении новой цены с ценой типа цены нужно будет сбросить тип цены в 0 (не выбран), т.к. это уже будет не цена типа цены
  product_sumprice: number;
  price_type: string;
  price_type_id: number;
  available: number; 
  nds: string;
  nds_id: number;
  reserve: boolean;// зарезервировано                                                                                (formSearch.reserve)
  priority_type_price: string;// приоритет типа цены: Склад (sklad) Покупатель (cagent) Цена по-умолчанию (defprice)  (formSearch.priorityTypePriceSide)
  department_id: number; // склад с которого будет производиться отгрузка товара.     
  department: string; // склад с которого будет производиться отгрузка товара.                                   (secondaryDepartmentId)
  shipped:number; //отгружено        
  total: number; //всего на складе
  reserved: number; // сколько зарезервировано в других Заказах покупателя
  reserved_current: number; // сколько зарезервировано в данном заказе покупателя  
  ppr_name_api_atol: string; //Признак предмета расчета в системе Атол. Невидимое поле. Нужно для передачи в таблицу товаров в качестве тега для чека на ккм Атол
  is_material: boolean; //определяет материальный ли товар/услуга. Нужен для отображения полей, относящихся к товару и их скрытия в случае если это услуга (например, остатки на складе, резервы - это неприменимо к нематериальным вещам - услугам, работам)            
}
interface KassaList{
  id: number;// id  кассы
  company_id: number; // id предприятия
  department_id: number; // id отделения
  name: string; // наименование кассы
  server_type: string; // тип сервера (атол или ккмсервер)
  sno1_id: number; // id системы налогообложения
  device_server_uid: string;// уник. идентификатор кассы на сервере
  server_address: string;//адрес сервера в сети
  sno1_name_api_atol:string; //система налогообложения кассы
  billing_address:string; // адрес места расчетов
  company_email:string; // email предприятия
}
interface KassaSettings{
  selected_kassa_id: number;// id выбранной кассы
  cashier_value_id:string;//кассир: 'current'-текущая учетная запись, 'another'-другая учетная запись, 'custom' произвольные ФИО
  customCashierFio:string;// произвольное ФИО кассира (для cashier_value_id = custom)
  customCashierVatin:string;//произвольный ИНН кассира (для cashier_value_id = custom)
  billing_address:string; // id адреса места расчётов. 'settings' - как в настройках кассы, 'customer' - брать из адреса заказчика, 'custom' произвольный адрес. Если 2 или 3 нет но один из них выбран - печатается settings
  custom_billing_address:string; // кастомный адрес расчетов
}
interface SpravSysNdsSet{
  id: number;
  name: string;
  description: string;
  name_api_atol: string;
  is_active: string;
  calculated: string;
}

@Component({
  selector: 'app-kkm',
  templateUrl: './kkm.component.html',
  styleUrls: ['./kkm.component.css'],
  providers: [LoadSpravService,Cookie,KkmAtolService,MatDialog,]
})
export class KkmComponent implements OnInit {

  kassa_status:string; //статус взаимодействия с ККМ
  shift_status:string; //статус смены ККМ
  shiftStatusId:string; //id статуса смены ККМ: closed - закрыта  opened - открыта  expired - истекла (превысила 24 часа)
  operationId: string = "undefined"; // алиас операции с ККМ (например sell или openShift). Сначала ставим undefined, пока не определим в методе setCanWorkWithKassa() можно ли работать с кассой 
  operationName: string = "Операции с ККМ"; //наименование операции с ККМ (выбирается из меню блока Операции с ККМ)
  nal_income: string=''; //внесено в кассу наличными при оплате. string - для возможности оставлять поле пустым (иначе будет 0, который нужно будет сначала удалять, а потом уже вписывать значение, что неудобно для кассира)
  bnal_income: string=''; //оплачено безналичными (при смешанной форме оплаты)
  kktBlockSize: string='small';// высота блока операций с ККМ. Нужна для её динамического увеличения 
  userInfo: any;//информация о пользователе
  kassaList:KassaList[]; //массив с загруженными кассами для кассира
  loginform: any ; //форма для логина другого кассира
  kassaSettingsForm: any; //форма с настройками кассира. нужна для их сохранения
  kassaSettings: KassaSettings;//настройки кассира/ нужны для восстановления настроек в случае их изменения и не сохранения
  anotherCashierIsLoggedIn = false;
  cashierFio: string=''// ФИО кассира, которое будет выводиться в кассу. 
  cashierVatin : string=''// ИНН кассира, который будет выводиться в кассу.
  anotherCashierFio = '';// ФИО кассира другой (another) учетной записи
  anotherCashierVatin='';// ИНН кассира другой (another) учетной записи
  canWorkWithKassa=false;// возможно ли работать с кассой. false если например не выбрана касса, пустое имя кассира или адрес расчетов
  // cheque_nds=false; //нужно ли проставлять НДС в чеке. 
  totalSumPrice: string='0.00'//итоговая цена
  productsTable: CustomersOrdersProductTable[]=[]; //массив, содержащий все товары, которые будут отражены в чеке
  // установки кассы для связи с сервером и печати чека (тегов чека)
  server_type: string; // тип сервера (атол или ккмсервер)
  device_server_uid: string;// уник. идентификатор кассы на сервере
  server_address: string;//адрес сервера в сети
  sno1_name_api_atol:string=''; //система налогообложения кассы
  kassa_billing_address:string=''; //адрес места расчётов в документе "Касса"
  company_email:string=''; // email предприятия
  server_type_temp: string; // тип сервера (атол или ккмсервер) - для теста связи
  device_server_uid_temp: string;// уник. идентификатор кассы на сервере - для теста связи
  server_address_temp: string;//адрес сервера в сети - для теста связи
  billingAddress: string='';// финальный адрес места расчётов, который будет передаваться в кассу при печати чека. (paymentsPlace	Место проведения расчета (тег 1187))
  // для избежания дабл-клика и повторной печати чеков:
  sellReceiptIsPrinted: boolean=false;                //Чек прихода
  buyReceiptIsPrinted: boolean=false;                 //Чек расхода
  sellReturnReceiptIsPrinted: boolean=false;          //Чек возврата прихода
  buyReturnReceiptIsPrinted: boolean=false;           //Чек возврата расхода
  sellCorrectionReceiptIsPrinted: boolean=false;      //Чек коррекции прихода
  buyCorrectionReceiptIsPrinted: boolean=false;       //Чек коррекции расхода
  sellReturnCorrectionReceiptIsPrinted: boolean=false;//Чек коррекции возврата прихода (ФФД 1.1)
  buyReturnCorrectionReceiptIsPrinted: boolean=false; //Чек коррекции возврата расхода (ФФД 1.1)
  correctionBaseDate:string='';//Дата совершения корректируемого расчета (тег 1178)
  correctionType:string='self';//Тип коррекции (тег 1173)	self - самостоятельно, instruction - по предписанию
  correctionBaseNumber:string='';//Номер предписания налогового органа (тег 1179)
  correctionCommentary:string='';//Комментарий для чека коррекции
  // тест соединения с кассой
  test_status:string=''; // статус соединения (200, 404 и т.д.)
  wasConnectionTest:boolean=false;// был ли тест соединения с кассой
  requestToServer:boolean=false;// идет запрос к серверу
  testSuccess=false;// запрос к серверу был со статусом 200
  // itIsReallySellOperation:boolean=false;// при запросе к результатам печати чека была ли это операция продажи (т.к. х-отчет может печататься из Чека прихода, нельзя чтобы при печати х-отчета создавался новый документ)

  @ViewChild("formCashierLogin", {static: false}) formCashierLogin; 
  @Input()  autocreateOnCheque: boolean;
  @Input()  addressString: string;// адрес в родительском документе (может использоваться в качестве места расчетов)
  @Input()  department_id: number; // id отделения. Нужен для загрузки списка касс по отделению
  @Input()  spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 
  @Input()  kkmCanWork:boolean; //можно ли отбивать чек
  @Input()  selectedPaymentType: string;//Оплата чека прихода (наличными - cash, безналичными - electronically, смешанная - mixed)
  @Input()  cheque_nds:boolean;//нужно ли проставлять НДС в чеке. Берется от переключателя "НДС"
  @Input()  department:string; //наименование отделения
  @Input()  company:string; // наименование предприятия
  @Output() sendingProductsTableEvent = new EventEmitter<any>(); //запрос таблицы с товарами и услугами
  @Output() succesfulChequePrinting = new EventEmitter<any>();   //событие успешной печати чека

  constructor(
    private cdRef:ChangeDetectorRef,
    private kkmAtolService: KkmAtolService,
    private http: HttpClient,
    public ConfirmDialog: MatDialog,
    private MessageDialog: MatDialog,
    private loadSpravService:   LoadSpravService,
    private _snackBar: MatSnackBar,
    private kkmAtolChequesService:KkmAtolChequesService,

  ) { }

  ngOnInit(): void {
    //форма настроек кассира
    this.kassaSettingsForm = new FormGroup({
      selected_kassa_id: new FormControl             (null,[Validators.required]), // id кассы
      cashier_value_id: new FormControl         ('current',[Validators.required]), //кассир: 'current'-текущая учетная запись, 'another'-другая учетная запись, 'custom' произвольные ФИО
      customCashierFio: new FormControl         ('',[Validators.required]), // значение поля ФИО при выборе пункта "Произвольное ФИО"
      customCashierVatin: new FormControl       ('',[Validators.required,Validators.pattern('^[0-9]{12}$'),Validators.maxLength(12),Validators.minLength(12)]),// значение поля ИНН при выборе пункта "Произвольное ФИО"
      billing_address: new FormControl           ('settings',[]),// id адреса места расчётов. 'settings' - как в настройках кассы, 'customer' - брать из адреса заказчика, 'custom' произвольный адрес. Если 2 или 3 нет но один из них выбран - печатается settings
      custom_billing_address: new FormControl     ('',[Validators.required]),// адрес места расчетов типа г.Такой-то, ул.... и т.д.
    });
    //логин другого кассира
    this.loginform = new FormGroup({
      username: new FormControl ('',[Validators.required,Validators.minLength(6)]),
      password: new FormControl ('',[Validators.required]),
    });
    if(Cookie.get('anotherCashierVatin')=='undefined' || Cookie.get('anotherCashierVatin')==null)    
      Cookie.set('anotherCashierVatin',''); else this.anotherCashierVatin=Cookie.get('anotherCashierVatin');

    if(Cookie.get('anotherCashierFio')=='undefined' || Cookie.get('anotherCashierFio')==null)    
      Cookie.set('anotherCashierFio',''); else this.anotherCashierFio=Cookie.get('anotherCashierFio');

    this.kassaSettingsForm.get("customCashierFio").disable();
    this.kassaSettingsForm.get("customCashierVatin").disable();

        
    this.getMyShortInfo();//краткая информация о пользователе (точка входа в кассу)
  }

  onClickOpenShift(){
    this.operationId='openShift';
    this.operationName='Открытие смены';
    this.getShiftStatus();
  }  
  onClickCloseShift(){
    this.operationId='closeShift';
    this.operationName='Закрытие смены';
    this.getShiftStatus();
  }  
  onClickKassaSettings(){
    this.operationId='kassaSettings';
    this.operationName='Настройки';
  }
  onClickPrintXreport(){
    let response: any;
    let uuid: string = this.getUUID();
    // this.operationId='closeShift';
    // this.operationName='Закрытие смены';
    this.kassa_status="Отправка запроса на печать Х-отчета";
    this.kkmAtolService.printXreport(this.server_address,uuid,this.device_server_uid,this.cashierFio,this.cashierVatin).subscribe(
      (data) => {
        response=data as any;
        console.log("Статус запроса на печать Х-отчета - "+response.status);
        if(+response.status>=200 && +response.status<300){
          //Задание успешно добавлено в очередь выполнения для ККМ
          console.log('Задание успешно добавлено в очередь выполнения для ККМ');
          //Проверка исполнения задания
          this.getTaskStatus(uuid,1,1000,false);
        }else{ 
          switch(response.status){
            case 401:{this.kassa_status="Ошибка: Авторизация не пройдена";break;};
            case 403:{this.kassa_status="Ошибка: ККМ не активирована";break;};
            case 404:{this.kassa_status="Ошибка: ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
            case 408:{this.kassa_status="Ошибка: За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже.";break;};
            case 409:{this.kassa_status="Ошибка: Задание с таким же uuid уже существует";break;};
            case 420:{this.kassa_status="Ошибка: Произошла ошибка во время проверки формата задания";break};
            default:{this.kassa_status="Ошибка: Неизвестная ошибка";};
          }
          console.log(this.kassa_status);
        }
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }
  getShiftStatus(onStart?:boolean){
    this.kkmAtolService.queryShiftStatus(this.server_address,'status',this.device_server_uid).subscribe(
      (data) => {
        let response=data as any;
        try{
          console.log("Статус смены-"+response.shiftStatus.state);
          //если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
          //тогда в catch запрашиваем уточненный статус http запроса (4ХХ) и расшифровываем ошибку
          this.shiftStatusId=response.shiftStatus.state;
          switch(this.shiftStatusId){
            case "closed":{this.shift_status="Смена закрыта";break;}
            case "opened":{this.shift_status="Смена открыта";break;}
            case "expired":{this.shift_status="Смена открыта но истекла (превысила 24 часа). Для открытия новой смены закройте текущую.";break;}
          }
          if(onStart){
            if(this.shiftStatusId=="expired"){
              this.operationId='closeShift';
              this.operationName='Закрытие смены';
            }else{
              this.operationId='sell';
              this.operationName='Чек прихода';
            }
          }
        } catch (e) {
          console.log("Код статуса не = 200");
          console.log("Запрос кода ошибки...");
          this.operationId='error';
          // this.operationId='openShift';
          this.operationName='Ошибка ККМ';
          this.shift_status="Запрос кода ошибки...";
          //ошибки тоже возворащают объект, в котором может содержаться детальное описание ошибки:
          let errorMessage:string=response.error.description;
          this.kkmAtolService.queryShiftStatus(this.server_address,'errorCode',this.device_server_uid).subscribe((data) => {
            let response=data as any;
            switch(response){
              case 401:{this.shift_status="Ошибка: Авторизация не пройдена";break;};
              case 403:{this.shift_status="Ошибка: ККМ не активирована";break;};
              case 404:{this.shift_status="ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
              case 408:{this.shift_status="За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже";break;};
              default:{this.shift_status="Ошибка при выполнении запроса";};//420
              this.shift_status=this.shift_status+'. '+errorMessage;
            }
          }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
        }
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Нет связи с сервером "Атол web-сервер"'}})});
  }  
  openShift(){
    let response: any;
    let uuid: string = this.getUUID();
    this.operationName='Открытие смены';
    this.kassa_status="Отправка запроса на открытие смены...";
    this.kkmAtolService.openShift(this.server_address,uuid,this.device_server_uid,this.cashierFio,this.cashierVatin).subscribe(
      (data) => {
        response=data as any;
        console.log("Статус открытия смены - "+response.status);
        if(+response.status>=200 && +response.status<300){
          //Задание успешно добавлено в очередь выполнения для ККМ
          console.log('Задание успешно добавлено в очередь выполнения для ККМ');
          //Проверка исполнения задания
          this.getTaskStatus(uuid,1,1000);
        }else{ 
          switch(response.status){
            case 401:{this.kassa_status="Ошибка: Авторизация не пройдена";break;};
            case 403:{this.kassa_status="Ошибка: ККМ не активирована";break;};
            case 404:{this.kassa_status="Ошибка: ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
            case 408:{this.kassa_status="Ошибка: За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже.";break;};
            case 409:{this.kassa_status="Ошибка: Задание с таким же uuid уже существует";break;};
            case 420:{this.kassa_status="Ошибка: Произошла ошибка во время проверки формата задания";break;};
            default:{this.kassa_status="Ошибка: Неизвестная ошибка";};
          }
          console.log(this.kassa_status);
        }
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }  

  closeShift(){
    let response: any;
    let uuid: string = this.getUUID();
    this.operationId='closeShift';
    this.operationName='Закрытие смены';
    this.kassa_status="Отправка запроса на закрытие смены";
    this.kkmAtolService.closeShift(this.server_address,uuid,this.device_server_uid,this.cashierFio,this.cashierVatin).subscribe(
      (data) => {
        response=data as any;
        console.log("Статус открытия смены - "+response.status);
        if(+response.status>=200 && +response.status<300){
          //Задание успешно добавлено в очередь выполнения для ККМ
          console.log('Задание успешно добавлено в очередь выполнения для ККМ');
          //Проверка исполнения задания
          this.getTaskStatus(uuid,1,1000);
        }else{ 
          switch(response.status){
            case 401:{this.kassa_status="Ошибка: Авторизация не пройдена";break;};
            case 403:{this.kassa_status="Ошибка: ККМ не активирована";break;};
            case 404:{this.kassa_status="Ошибка: ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
            case 408:{this.kassa_status="Ошибка: За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже.";break;};
            case 409:{this.kassa_status="Ошибка: Задание с таким же uuid уже существует";break;};
            case 420:{this.kassa_status="Ошибка: Произошла ошибка во время проверки формата задания";break};
            default:{this.kassa_status="Ошибка: Неизвестная ошибка";};
          }
          console.log(this.kassa_status);
        }
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  } 
  testKassaConnect(){
    this.wasConnectionTest=true;
    this.requestToServer=true;
    this.test_status= '';
    this.kkmAtolService.queryDeviceInfo(this.server_address_temp,'info',this.device_server_uid_temp).subscribe(//параметры: 1й - запрос информации (может быть еще запрос кода ошибки), 2й - id кассы в сервере Атола
      (data) => {
        let response=data as any;
        try{
          //если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
          //тогда в catch запрашиваем уточненный статус http запроса (4ХХ) и расшифровываем ошибку
          let tryNotToCatchTheError = response.deviceInfo.modelName;
          this.requestToServer=false;
          this.test_status='Соединение установлено!';
        } catch (e) {
          this.test_status="Ошибка связи с кассой. Запрос кода ошибки..."
          this.requestToServer=true;
          let errorMessage:string=response.error.description;//ошибки тоже возворащают объект, в котором может содержаться детальное описание ошибки
          if(errorMessage=='Порт недоступен'||errorMessage=='Нет связи') errorMessage=errorMessage+'. Проверьте, включена ли касса и подключена ли она к компьютеру.'
          this.kkmAtolService.queryShiftStatus(this.server_address_temp,'errorCode',this.device_server_uid_temp).subscribe((data) => {
            this.requestToServer=false;
            let response=data as any;
            switch(response){
              case 401:{this.test_status="Ошибка: Авторизация не пройдена";break;};
              case 403:{this.test_status="Ошибка: ККМ не активирована";break;};
              case 404:{this.test_status="ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
              case 408:{this.test_status="За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже";break;};
              default :{this.test_status="Ошибка при выполнении запроса";};//420
              console.log(this.test_status);
              this.test_status=this.test_status+'. '+errorMessage;
            }
          }, error => {console.log(error);this.requestToServer=false;});
        }
      }, error => {console.log(error);this.requestToServer=false;this.test_status= 'Нет связи с сервером';});
  }
  onClickReceipt(receiptTypeId:string,receiptTypeName:string){
    this.operationId=receiptTypeId;
    this.operationName=receiptTypeName;
    this.kassa_status='';
  }
  // перед печатью чека проверяем на дабл-клик и повторную отправку.
  checkAndPrintReceipt(){
    let receiptIsPrinted:boolean;
    if(this.selectedPaymentType=='electronically'){
      this.bnal_income=this.totalSumPrice;
    }
    switch (this.operationId){
      case 'sell':{if(this.sellReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'buy':{if(this.buyReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'sellReturn':{if(this.sellReturnReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'buyReturn':{if(this.buyReturnReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'sellCorrection':{if(this.sellCorrectionReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'buyCorrection':{if(this.buyCorrectionReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'sellReturnCorrection':{if(this.sellReturnCorrectionReceiptIsPrinted) receiptIsPrinted=true; break;}
      case 'buyReturnCorrection':{if(this.buyReturnCorrectionReceiptIsPrinted) receiptIsPrinted=true; break;}
    }
    if(receiptIsPrinted){
      const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
        width: '400px',
        data:
        { 
          head: 'Попытка повторного отбития чека "'+this.operationName+'"',
          warning: 'Отбить '+this.operationName+' ещё раз?',
          query: 'Чек данного типа уже отправлялся на регистрацию из данного документа. Возможно, вы сделали двойной клик по кнопке "Отбить чек"',
        },
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result==1){
          this.printReceipt();
        }
      });  
    } else this.printReceipt();
  }
  // отправка на печать чека прихода/расхода/коррекции
  printReceipt(){
    let response: any;
    let uuid: string = this.getUUID();
    let cheque:any; //объект чека
    let chequeItem: any; //объект позиции в чеке
    let textItem: any //объект дополнительного элемента для вывода до печати документа
    let dividerItem: any = this.kkmAtolChequesService.getDividerItem(); //объект разделителя позиций в чеке
    let payment: any; //объект оплаты в чеке
    switch(this.operationId){
      case 'sell':{cheque=this.kkmAtolChequesService.getCheque();break;}
      default :{cheque=this.kkmAtolChequesService.getCorrectionCheque11();break;}
    }
    
    console.log(this.kassa_status);
    // конструирование чека из его составляющих (сервис KkmAtolChequesService):
    cheque.uuid=uuid; 
    cheque.request[0].type=this.operationId;//операция (sell,buy и т.д.)
    cheque.request[0].taxationType=this.sno1_name_api_atol;//система налогообложения кассы (из паспорта кассы)
    cheque.request[0].paymentsPlace=this.billingAddress;//место расчетов
    cheque.request[0].operator.name=this.cashierFio;
    cheque.request[0].operator.vatin=this.cashierVatin;
    //название чека (т.к. касса не всегда выводит название чека).
    textItem=this.kkmAtolChequesService.getTextItem();
    textItem.text=this.operationName;
    textItem.alignment='center';
    textItem.doubleWidth=true;
    cheque.request[0].preItems.push(textItem);
    //параметры только для чека коррекции
    if(this.operationId=='sellCorrection'||this.operationId=='buyCorrection'||this.operationId=='sellReturnCorrection'||this.operationId=='buyReturnCorrection'){
      cheque.request[0].correctionType=this.correctionType;
      cheque.request[0].correctionBaseDate=moment(this.correctionBaseDate).format('YYYY.MM.DD').toString();//кассе нужна дата в формате YYYY.MM.DD
      cheque.request[0].correctionBaseNumber=this.correctionBaseNumber;
      textItem=this.kkmAtolChequesService.getTextItem();
      textItem.alignment='center';
      textItem.text='Параметры коррекции:';
      cheque.request[0].postItems.push(textItem);
      textItem=this.kkmAtolChequesService.getTextItem();
      textItem.alignment='left';
      textItem.text='Дата коррекции: '+moment(this.correctionBaseDate).format('DD.MM.YYYY').toString();
      cheque.request[0].postItems.push(textItem);
      textItem=this.kkmAtolChequesService.getTextItem();
      textItem.text='Тип коррекции: '+(this.correctionType=='self'?'Самостоятельно':'По предписанию');
      cheque.request[0].postItems.push(textItem);
      if(this.correctionType=='instruction'){
        textItem=this.kkmAtolChequesService.getTextItem();
        textItem.text='Номер предписания: '+this.correctionBaseNumber;
        cheque.request[0].postItems.push(textItem);
      } 
      if(this.correctionCommentary.length>0){
        textItem=this.kkmAtolChequesService.getTextItem();
        textItem.text='Комментарий: '+this.correctionCommentary;
        cheque.request[0].postItems.push(textItem);
      }
    }
    //забираем товарные позиции из компонента поиска и добалвения товара
    this.getProductsTable();
    //товарные позиции
    this.productsTable.forEach(row => {
      cheque.request[0].items.push(dividerItem);
      chequeItem=this.kkmAtolChequesService.getChequeItem();
      chequeItem.type='position';
      chequeItem.name=row.name;
      chequeItem.price=+row.product_price;
      chequeItem.quantity=+row.product_count;
      chequeItem.amount=+row.product_sumprice;
      chequeItem.department=1;
      chequeItem.paymentMethod='fullPayment';     
      chequeItem.paymentObject=row.ppr_name_api_atol;       //Признак предмета расчета - Товар/Услуга/Работа и т.д.
      chequeItem.tax.type= this.cheque_nds?this.getNdsApiAtolName(+row.nds_id):'none';                 //НДС
      cheque.request[0].items.push(chequeItem);
    });
    cheque.request[0].items.push(dividerItem);
    payment=this.kkmAtolChequesService.getPayment();
    switch(this.selectedPaymentType){
      case "cash":{
        payment.type= 'cash';
        payment.sum=+this.nal_income;
        cheque.request[0].payments.push(payment);
        break;
      }
      case "electronically":{
        payment.type= 'electronically';
        payment.sum=+this.bnal_income;
        cheque.request[0].payments.push(payment);
        break;
      }
      case "mixed":{
        payment.type= 'cash';
        payment.sum=+this.nal_income;
        cheque.request[0].payments.push(payment);
        payment=this.kkmAtolChequesService.getPayment();
        payment.type= 'electronically';
        payment.sum=+this.bnal_income;
        cheque.request[0].payments.push(payment);
        break;
      }
    }
    this.kassa_status="Отправка запроса на печать чека";
    this.kkmAtolService.receipt(cheque).subscribe(
      (data) => {
        response=data as any;
        console.log("Статус запроса по отправке чека на очередь печати - "+response.status);
        if(+response.status>=200 && +response.status<300){
          //Задание успешно добавлено в очередь выполнения для ККМ
          console.log('Задание успешно добавлено в очередь выполнения для ККМ');
          //Проверка исполнения задания
          this.getTaskStatus(uuid,1,1000,true);
          //отмечаем что чек отправляли на отбивание
          switch (this.operationId){
            case 'sell':{this.sellReceiptIsPrinted=true; break;}
            case 'buy':{this.buyReceiptIsPrinted=true; break;}
            case 'sellReturn':{this.sellReturnReceiptIsPrinted=true; break;}
            case 'buyReturn':{this.buyReturnReceiptIsPrinted=true; break;}
            case 'sellCorrection':{this.sellCorrectionReceiptIsPrinted=true; break;}
            case 'buyCorrection':{this.buyCorrectionReceiptIsPrinted=true; break;}
            case 'sellReturnCorrection':{this.sellReturnCorrectionReceiptIsPrinted=true; break;}
            case 'buyReturnCorrection':{this.buyReturnCorrectionReceiptIsPrinted=true; break;}
          }
        }else{ 
          switch(response.status){
            case 401:{this.kassa_status="Ошибка: Авторизация не пройдена";break;};
            case 403:{this.kassa_status="Ошибка: ККМ не активирована";break;};
            case 404:{this.kassa_status="Ошибка: ККМ по заданному идентификатору не найдена или ККМ по умолчанию не выбрана";break;};
            case 408:{this.kassa_status="Ошибка: За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже.";break;};
            case 409:{this.kassa_status="Ошибка: Задание с таким же uuid уже существует";break;};
            case 420:{this.kassa_status="Ошибка: Произошла ошибка во время проверки формата задания";break};
            default:{
              this.kassa_status="Ошибка: Неизвестная ошибка";
            };
          }
          console.log(this.kassa_status);
        }
      }, 
      error => {
        console.log(error);
        this.kassa_status="Ошибка связи с сервером. Проверьте, запущен ли сервер Атол"
      }
    );
  } 

  //получает результат задания
	getTaskStatus(uuid:string,cnt:number,time:number,itIsReallySellOperation?:boolean)
	{
    let maxTrying=3;
    let responseStatus:string;
    let response: any = null;
    // this.itIsReallySellOperation=itIsReallySellOperation;
    this.kassa_status="Ожидание выполнения задания...";
    console.log("Попытка "+cnt);
    this.sleep(time)
    .then(() => {
      console.log("запрос... ");
      
      this.kkmAtolService.getTaskStatus(uuid).subscribe(data => {
        response=data as any;
        try{
          console.log("Статус задания-"+response.results[0].status);

          //если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
          //тогда в catch запрашиваем уточненный статус и ошибку
          responseStatus=response.results[0].status;
          
          switch(responseStatus){
            case "ready":{
              this.kassa_status="Задание выполнено без ошибок. ";
              this.getShiftStatus(); // для обновления состояния смены. Если запрос был по открытию или закрытию смены - статус смены обновится
              //если это был чек прихода, и это чек прихода
              if(this.operationId=='sell' && itIsReallySellOperation){
                // эмитируем событие успешной печати чека, которое обработается в родительском документе
                // alert('succesfulChequePrinting');
                this.succesfulChequePrinting.emit();
              }
              break;
            }
            case "error":{
              this.kassa_status="Задание выполнено с ошибкой: "+response.results[0].error.description;
              if(response.results[0].error.description=="Превышение длины реквизита") 
                this.kassa_status=this.kassa_status+". Возможно, введён неверный ИНН";
              break;
            }
            case "wait":{
              this.kassa_status="Задание ожидает выполнения. ";
              break;
            }
            case "inProgress":{
              this.kassa_status="Задание выполняется. ";
              break;
            }
            case "interrupted ":{
              this.kassa_status="Задание не выполнялось, т.к. предыдущие задания выполнены с ошибкой. ";
              break;
            }
            case "blocked":{
              this.kassa_status="Задание результат задания неизвестен, очередь выполнения остановлена. ";
              break;
            }
            case "canceled":{
              this.kassa_status="Задание прервано. ";
              break;
            }
          }
          this.cdRef.detectChanges();
          if (cnt<=maxTrying && (responseStatus=='wait' || responseStatus=='inProgress')){
            cnt++;
            console.log("Макс. количество попыток не использовано, статус - wait или inProgress")
            // alert('повторяем...');
            this.getTaskStatus(uuid,cnt,2000,itIsReallySellOperation)
          } 
          // if( (cnt>maxTrying){

          // }

        } catch (e) {
          console.log("Код статуса не = 200");
          console.log("Запрос кода ошибки...");
          this.getTaskErrorCode(uuid);
        }
      }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
    });
  }

  getTaskErrorCode(uuid:string){
    this.kkmAtolService.getTaskCode(uuid).subscribe((data) => {
      let response=data as any;
      switch(response){
        case 401:{
          this.kassa_status="Ошибка: Авторизация не пройдена";
          break;
        };
        case 403:{
          this.kassa_status="Ошибка: ККМ не активирована";
          break;
        };
        default:{
          this.kassa_status="Ошибка: ККМ по заданному идентификатору не найдена, или ККМ по умолчанию не выбрана, или задание с указанным UUID не найдено";
        };
        console.log(this.kassa_status);
      }
    }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
  }
  onSelectedPaymentType(paymentType:string){
    this.bnal_income='';
    this.nal_income='';
    switch(paymentType){
      case 'cash':{
        this.selectedPaymentType='cash';
        break;
      };
      case 'electronically':{
        this.selectedPaymentType='electronically';
        this.bnal_income=this.totalSumPrice;
        break;
      };
      case 'mixed':{
        this.selectedPaymentType='mixed';
        break;
      };
    }
  }
  //расчет сдачи
  getChange():string{
    //сдача равна сумме внесенной в кассу наличности и оплаченного безнала, минус стоимость покупки:
    let change:number=(+this.nal_income + (+this.bnal_income))-(+this.totalSumPrice);
    return (change<0?0:change).toFixed(2);
  }
  getMyShortInfo(){
    this.loadSpravService.getMyShortInfo()
    .subscribe(
        (data) => {
          this.userInfo=data as any;
          this.getKassaListByDepId();//загружаем список доступных касс
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }
  //вход в систему другого кассира
  cashierLogin(){
    let isUserCanWorkWithKKM: boolean;
    let user: any;
    this.loadSpravService.isUserCanWorkWithKKM(this.loginform.get('username').value,this.loginform.get('password').value,)
    .subscribe(
        (data) => {
          isUserCanWorkWithKKM=data as boolean;
          if(isUserCanWorkWithKKM){

            this.loadSpravService.getUserByLoginInfo(this.loginform.get('username').value,this.loginform.get('password').value,)
            .subscribe(
                (data) => {
                  user=data as any;
                  this.anotherCashierFio=user.name;
                  this.anotherCashierVatin=user.vatin;
                  Cookie.set('anotherCashierFio',this.anotherCashierFio);
                  Cookie.set('anotherCashierVatin',this.anotherCashierVatin);
                  this.formCashierLogin.resetForm();
                  this.openSnackBar("Вход выполнен", "Закрыть");
                },
                error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
            );

          } else {
            this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка аутентификации!',message:'Неправильные логин или пароль, либо пользователь не имеет статус "Активный", либо пользователь не из этого предприятия.'}});
            this.kassaSettingsForm.get('cashier_value_id').setValue('current');
            this.cashierFio='';
            this.cashierVatin='';
            this.onCashierTypeChange();
          }
        },
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
    );
  }
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  onCashierTypeChange(){
    this.anotherCashierIsLoggedIn=false;
    this.wasConnectionTest=false;
    switch(this.kassaSettingsForm.get('cashier_value_id').value){
      case 'current':{//кассир - текущая учетная запись
        this.kassaSettingsForm.get("customCashierFio").disable();
        this.kassaSettingsForm.get("customCashierVatin").disable();
        break;
      }
      case 'another':{//кассир - другая учетная запись
        this.kassaSettingsForm.get("customCashierFio").disable();
        this.kassaSettingsForm.get("customCashierVatin").disable();
        break;
      }
      case 'custom':{ //кассир - произвольные ФИО и ИНН
        this.kassaSettingsForm.get("customCashierFio").enable();
        this.kassaSettingsForm.get("customCashierVatin").enable();
      }
    }
  }
  //устанавлиает финальные ФИО и ИНН кассира, которые будут выводиться в чек
  setCashierFioAndVatin(){
    switch(this.kassaSettingsForm.get('cashier_value_id').value){
      case 'current':{//кассир - текущая учетная запись
        this.cashierFio=this.userInfo.name;
        this.cashierVatin=this.userInfo.vatin;
        break;
      }
      case 'another':{//кассир - другая учетная запись
        this.cashierFio=this.anotherCashierFio;
        this.cashierVatin=this.anotherCashierVatin;
        break;
      }
      case 'custom':{ //кассир - произвольные ФИО и ИНН
        this.cashierFio=this.kassaSettingsForm.get('customCashierFio').value;
        this.cashierVatin=this.kassaSettingsForm.get('customCashierVatin').value;
      }
    }
  }
  onBillingAddressChange(){//вызывается поочередно 
    switch(this.kassaSettingsForm.get('billing_address').value){
      case 'settings':{// - как в настройках кассы
        this.kassaSettingsForm.get("custom_billing_address").disable();
        this.billingAddress=this.kassa_billing_address;
        break;
      }
      case 'customer':{// - брать из адреса заказчика
        this.kassaSettingsForm.get("custom_billing_address").disable();
        this.billingAddress=this.addressString;
        break;
      }
      case 'custom':{ // - произвольный адрес
        this.kassaSettingsForm.get("custom_billing_address").enable();
        this.billingAddress=this.kassaSettingsForm.get("custom_billing_address").value;
      }
    }
  }
 //сохраняет настройки кассира
  updateCashierSettings(){
    this.wasConnectionTest=false;
    return this.http.post('/api/auth/updateCashierSettings',  this.kassaSettingsForm.value)
      .subscribe(
          (data) => 
          {   
            this.openSnackBar("Настройки кассы сохранены", "Закрыть");
            //проверка верны ли настройки и можно ли работать с кассой после сохранения настроек
            this.operationId='undefined';
            this.getKassaListByDepId();
            if(this.kassaSettingsForm.get('cashier_value_id').value!='another'){
              this.anotherCashierFio='';
              this.anotherCashierVatin='';
              // this.anotherCashierIsLoggedIn=false;
              Cookie.set('anotherCashierFio','');
              Cookie.set('anotherCashierVatin','');
              // alert("Cookie.get('anotherCashierFio')-"+Cookie.get('anotherCashierFio')+", Cookie.get('anotherCashierVatin')-"+Cookie.get('anotherCashierVatin'));
              
            }
            
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
  }
  //загружает список касс для кассира по id отделения
  getKassaListByDepId(){
    this.http.get('/api/auth/getKassaListByDepId?id='+this.department_id)
      .subscribe(
          (data) => 
          {   
            this.kassaList=data as KassaList[];
            this.getKassaCashierSettings();
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
      );
  }
//загрузка настроек кассира
  getKassaCashierSettings(){
    this.http.get('/api/auth/getKassaCashierSettings')
      .subscribe(
          (data) => 
          {   
            this.kassaSettings=data as KassaSettings;
            if(this.kassaSettings.selected_kassa_id){//если настройки для кассы есть
              this.applyKassaCashierSettings(true);
            } else {
              this.kassaSettings.cashier_value_id=this.kassaSettingsForm.get("cashier_value_id").value;//когда еще настроек кассира нет - устанавливается кассир по дефолту (current), чтобы он уже был выбран. Если они есть - переназначится в applyKassaCashierSettings
              this.setCashierFioAndVatin();//Установить ФИО и ИНН для кассира по дефолту (current)
              this.setCanWorkWithKassa(true)
            };
          },
          error => {console.log(error)},
      );
  }
  //применение загруженных настроек кассира и информации о нем
  applyKassaCashierSettings(onStart?:boolean){
    this.kassaSettingsForm.get('selected_kassa_id').setValue(this.kassaSettings.selected_kassa_id);
    this.kassaSettingsForm.get('cashier_value_id').setValue(this.kassaSettings.cashier_value_id);
    this.kassaSettingsForm.get('customCashierFio').setValue(this.kassaSettings.customCashierFio);
    this.kassaSettingsForm.get('customCashierVatin').setValue(this.kassaSettings.customCashierVatin);
    this.kassaSettingsForm.get('billing_address').setValue(this.kassaSettings.billing_address);
    this.kassaSettingsForm.get('custom_billing_address').setValue(this.kassaSettings.custom_billing_address);
    this.getKassaValues();//взять из загруженного списка касс данные для связи и чека по выбранному id кассы
    this.getTemporaryKassaValues();// данные для тестирования связи с кассой.
    this.onCashierTypeChange();//чтобы заэнейблить нужные и задисейблить ненужные поля
    this.setCashierFioAndVatin();//Установить ФИО и ИНН для текущего кассира
    this.setCanWorkWithKassa(onStart);//узнать можно ли сейчас работать с кассой
    this.onBillingAddressChange(); // если адрес места растчетов "Произвольный адрес", он будет =  kassaSettingsForm.get('custom_billing_address')
  }
  //определяет, можно ли пользователю работать с кассой
  setCanWorkWithKassa(onStart?:boolean){
    if(
      this.kassaList.length==0||//нет доступных пользователю касс (из его отделений, разрешенные к использованию и не удаленные - в kassaList загружаются только касы подходящие под эти условия):
      +this.kassaSettingsForm.get('selected_kassa_id').value==0 ||//если касса не выбрана
      (this.kassaSettingsForm.get('cashier_value_id').value=='another'&&(this.anotherCashierFio==''||this.anotherCashierVatin==''))||//если выбрано "Другая учетная запись (custom)", но данных по ней нет
      this.cashierFio==''//кассир не выбран
      ) {
      this.canWorkWithKassa=false;
      this.operationId='cantwork';
      this.operationName='Работа с кассой невозможна.';
      // alert(+this.kassaSettingsForm.get('selected_kassa_id').value);
    } else {
      this.canWorkWithKassa=true;
      // this.operationId='sell';
      // this.operationName='Чек прихода';

      //если пользователь может работать с кассой - проверим, может ли работать сама касса))
      this.getShiftStatus(onStart);
    };
    // console.log('canWorkWithKassa - '+this.canWorkWithKassa);
  }
  //берет значения по кассе (server_type, server_address, device_server_uid) из загруженного в getKassaListByDepId списка касс
  getKassaValues(){
    this.kassaList.map(i=>{
      if(i.id==this.kassaSettingsForm.get('selected_kassa_id').value){
        this.server_type=i.server_type; // тип сервера (атол или ккмсервер)
        this.device_server_uid=i.device_server_uid;// уник. идентификатор кассы на сервере
        this.server_address=i.server_address;//адрес сервера в сети
        this.sno1_name_api_atol=i.sno1_name_api_atol; //система налогообложения кассы
        this.company_email=i.company_email; // email предприятия
        this.kassa_billing_address=i.billing_address; // адрес места растчетов
        this.onBillingAddressChange(); // если адрес места растчетов "Как в насройках кассы", он будет kassa_billing_address
      }
    })
  }
  //достает "наименование НДС по системе Атол" из загруженного справочника НДС
  getNdsApiAtolName(nds_id:number):string{
    let name:string='';
    this.spravSysNdsSet.map(i=>{
      if(i.id==nds_id){
        name=i.name_api_atol;
      }
    });
    return name;
  }
  //для тестирования связи с кассой.
  getTemporaryKassaValues(){
    this.kassaList.map(i=>{
      if(i.id==this.kassaSettingsForm.get('selected_kassa_id').value){
        this.server_type_temp=i.server_type; // тип сервера (атол или ккмсервер)
        this.device_server_uid_temp=i.device_server_uid;// уник. идентификатор кассы на сервере
        this.server_address_temp=i.server_address;//адрес сервера в сети
      }
    })
  }
  //при выборе из списка другой кассы берем её параметры для теста связи(адрес сервера и т.п.), а для чеков остается старая касса. Пока не сохраним настройки.
  onKassaSelection(){
    this.wasConnectionTest=false;
    this.getTemporaryKassaValues();
  }
  onClickMenuIcon(){
    this.kassa_status='';
    this.applyKassaCashierSettings();//восстанавливаем настройки в форме (если их не сохранили)
  }
  getUUID(): string {
    return (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`).replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  numberOnlyPlusDot(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && ((charCode < 48 || charCode > 57) && charCode!=46)) { return false; } return true;}
  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
    if (charCode > 31 && (charCode < 48 || charCode > 57)) { return false; } return true;}
  getProductsTable(){
    this.sendingProductsTableEvent.emit();
  }
}

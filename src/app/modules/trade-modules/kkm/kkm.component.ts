import { ChangeDetectorRef, ViewChild, Component, OnInit, Input, Output, ElementRef } from '@angular/core';
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
  zn_kkt:string; // заводской номер KKM
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

  zn_kkt:string; // заводской номер текущей KKM
  kassa_status:string; //статус взаимодействия с ККМ
  shift_status:string; //статус смены ККМ
  shiftStatusId:string; //id статуса смены ККМ: closed - закрыта  opened - открыта  expired - истекла (превысила 24 часа)
  fnSerial:string; // серийный номер фискального накопителя
  shiftNumber:number; // номер смены
  shiftExpiredAt:string;// дата и время экспирации смены - строка вида "2021-05-24T15:08:47+05:00"
  operationId: string = "undefined"; // алиас операции с ККМ (например sell или openShift). Сначала ставим undefined, пока не определим в методе setCanWorkWithKassa() можно ли работать с кассой 
  operationName: string = "Операции с ККМ"; //наименование операции с ККМ (выбирается из меню блока Операции с ККМ)
  nal_income: string=''; //внесено в кассу наличными при оплате. string - для возможности оставлять поле пустым (иначе будет 0, который нужно будет сначала удалять, а потом уже вписывать значение, что неудобно для кассира)
  bnal_income: string=''; //оплачено безналичными (при смешанной форме оплаты)
  kktBlockSize: string='small';// высота блока операций с ККМ. Нужна для её динамического увеличения 
  userInfo: any;//информация о пользователе
  kassaList:KassaList[] = []; //массив с загруженными кассами для кассира
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
  kassaId:number; // id кассы
  company_id:number; // id предприятия кассы
  server_type_temp: string; // тип сервера (атол или ккмсервер) - для теста связи
  device_server_uid_temp: string;// уник. идентификатор кассы на сервере - для теста связи
  server_address_temp: string;//адрес сервера в сети - для теста связи
  billingAddress: string='';// финальный адрес места расчётов, который будет передаваться в кассу при печати чека. (paymentsPlace	Место проведения расчета (тег 1187))
  // для избежания дабл-клика и повторной печати чеков:
  kkmIsFree: boolean = true;
  correctionBaseDate:string='';//Дата совершения корректируемого расчета (тег 1178)
  correctionType:string='self';//Тип коррекции (тег 1173)	self - самостоятельно, instruction - по предписанию
  correctionBaseNumber:string='';//Номер предписания налогового органа (тег 1179)
  correctionCommentary:string='';//Комментарий для чека коррекции
  // тест соединения с кассой
  test_status:string=''; // статус соединения (200, 404 и т.д.)
  wasConnectionTest:boolean=false;// был ли тест соединения с кассой
  requestToServer:boolean=false;// идет запрос к серверу
  testSuccess=false;// запрос к серверу был со статусом 200
  docId:number;//номер документа в реестре документов (таблица documents) от которого будет печататься чек, 
  id:number; // id документа (например, розничная продажа с id=102 )

  @ViewChild("nalInput") nalInput: ElementRef;//для считывания с поля Наличными в переменную nal_income. Т.к. ngModel при нажатии enter в данном поле сбрасывает его в 0
  @ViewChild("formCashierLogin", {static: false}) formCashierLogin; 
  @Input()  autocreateOnCheque: boolean;
  @Input()  addressString: string;// адрес в родительском документе (может использоваться в качестве места расчетов)
  @Input()  department_id: number; // id отделения. Нужен для загрузки списка касс по отделению
  @Input()  spravSysNdsSet: SpravSysNdsSet[] = []; //массив имен и id для ндс 
  @Input()  productTableIsValid:boolean; //валидна ли таблица товаров и можно ли отбивать чек
  @Input()  selectedPaymentType: string;//Оплата чека прихода (наличными - cash, безналичными - electronically, смешанная - mixed)
  @Input()  cheque_nds:boolean;//нужно ли проставлять НДС в чеке. Берется от переключателя "НДС"
  @Input()  department:string; //наименование отделения
  @Input()  company:string; // наименование предприятия
  @Output() sendingProductsTableEvent = new EventEmitter<any>(); //запрос таблицы с товарами и услугами
  @Output() succesfulChequePrinting = new EventEmitter<any>();   //событие успешной печати чека
  @Output() onClickChequePrinting = new EventEmitter<any>();   //событие нажатия на кнопку Отбить чек
  @Output() getTotalSumPriceEvent = new EventEmitter<any>();   //запрос на итоговую цену в таблице товаров и услуг
  
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

    
    console.log('Инициализация модуля ККМ')
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
    this.kassa_status='';
    this.operationId='kassaSettings';
    this.operationName='Настройки';
    this.onBillingAddressChange(); // чтобы задизсейблить поле "Место расчета произвольного адреса" в случае, если Место расчета не выбрано как "Произвольный адрес". Иначе кнопка "Сохранить настройки" будет неактивна
  }

  onClickPrintXreport(){
    this.operationId='printXreport';
    this.operationName='Печать X-отчёта';
  }  

  printXreport(){
    let response: any;
    let uuid: string = this.getUUID();
    this.kassa_status="Отправка запроса на печать Х-отчета";
    this.kkmAtolService.printXreport(this.server_address,uuid,this.device_server_uid,this.cashierFio,this.cashierVatin).subscribe(
      (data) => {
        response=data as any;
        console.log("Статус запроса на печать Х-отчета - "+response.status);
        if(+response.status>=200 && +response.status<300){
          //Задание успешно добавлено в очередь выполнения для ККМ
          console.log('Задание успешно добавлено в очередь выполнения для ККМ');
          //Проверка исполнения задания
          this.getTaskStatus(uuid,1,1000,this.operationId);
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
    this.kkmAtolService.queryShiftStatus(this.server_address,'status',this.device_server_uid).subscribe((data) =>{
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
            this.getTotalSumPriceEvent.emit();//запрос итоговой суммы
          }
        }
      } catch (e) {
        this.shift_status="Ошибка связи с кассой. Запрос кода ошибки..."
        this.operationId='error';
        this.operationName='Ошибка ККМ';
        this.requestToServer=true;
        let errorMessage:string=response.error.description;//ошибки тоже возворащают объект, в котором может содержаться детальное описание ошибки
        if(errorMessage=='Порт недоступен'||errorMessage=='Нет связи') 
          errorMessage=errorMessage+'. Проверьте, включена ли касса и подключена ли она к компьютеру.'
        this.kkmAtolService.queryShiftStatus(this.server_address,'errorCode',this.device_server_uid).subscribe((data) => {//запрашиваем код ошибки
          this.requestToServer=false;
          let response=data as any;
          switch(response){
            case 401:{this.shift_status="Ошибка: Авторизация не пройдена";break;};
            case 403:{this.shift_status="Ошибка: ККТ не активирована";break;};
            case 404:{this.shift_status="ККТ по заданному идентификатору не найдена или ККТ по умолчанию не выбрана";break;};
            case 408:{this.shift_status="За 30 секунд не удалось захватить управление драйвером (занят фоновыми непрерываемыми задачами). Повторите запрос позже";break;};
            default :{this.shift_status="Ошибка при выполнении запроса";};//420
          }
          this.shift_status=this.shift_status+'. '+errorMessage;
          console.log(this.shift_status);
        }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})});
      }
    }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Нет связи с сервером "Атол web-сервер"'}})});
  }  
  openShift(){
    let response: any;
    let uuid: string = this.getUUID();
    this.operationId='openShift';
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
          this.getTaskStatus(uuid,1,1000,this.operationId);
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
          this.getTaskStatus(uuid,1,1000,this.operationId);
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
    this.kkmAtolService.queryDeviceInfo(this.server_address_temp,'info',this.device_server_uid_temp).subscribe(//параметры: 2й - запрос информации (может быть еще запрос кода ошибки), 3й - id кассы в сервере Атола
    (data) => {
      let response=data as any;
      try{
        //если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
        //тогда в catch запрашиваем уточненный статус http запроса (4ХХ) и расшифровываем ошибку
        this.requestToServer=false;
        this.zn_kkt=response.deviceInfo.serial;
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
            default :{this.test_status="Ошибка при выполнении запроса";}//420
          }
          this.test_status=this.test_status+'. '+errorMessage;
          console.log(this.test_status);
        }, error => {console.log(error);this.requestToServer=false;});
      }
    }, error => {console.log(error);this.requestToServer=false;this.test_status= 'Нет связи с сервером';});
  }

  //при выборе типа чека через меню кассового блока
  onClickReceipt(receiptTypeId:string,receiptTypeName:string){
    this.operationId=receiptTypeId;
    this.operationName=receiptTypeName;
    this.kassa_status='';
  }


  //Вызывается при успешном окончании задания
  //метод заносит информацию об операциях взаимодействия с ККМ в БД (например, открытия/закрытия смен, пробитие чеков и т.д.)
  //вызывается при успешном заврешении задания на ККМ. 
  onTaskSuccess(operationId:string){
    console.log('Задание '+operationId+' на ККМ успешно завершено.');
    if(operationId=='sell'||operationId=='openShift'||operationId=='closeShift'){
      console.log('Начало запроса информации из ККМ для создания чека в базе данных:');
      this.requestToServer=true;
      // сначала запрашиваем заводской номер ККМ
      console.log('Запрос заводского номера ККТ...');
      this.kkmAtolService.queryDeviceInfo(this.server_address_temp,'info',this.device_server_uid_temp).subscribe(//параметры: 2й - запрос информации (может быть еще запрос кода ошибки), 3й - id кассы в сервере Атола
      (data) => {
        let response=data as any;
        try{
          this.requestToServer=false;
          this.zn_kkt=response.deviceInfo.serial; //получили заводской номер ККМ
          console.log(this.zn_kkt);
          //запрашиваем информацию о смене
          console.log('Запрос информации о смене...');
          this.kkmAtolService.queryShiftStatus(this.server_address,'status',this.device_server_uid).subscribe(
            (data) => {
              let responseShiftStatus=data as any;
              try{
                this.shiftStatusId=responseShiftStatus.shiftStatus.state; // статус смены: opened closed expired
                this.shiftNumber=responseShiftStatus.shiftStatus.number; // номер смены
                this.shiftExpiredAt=responseShiftStatus.shiftStatus.expiredAt; // время истечения (экспирации) смены
                console.log('Статус смены - '+this.shiftStatusId);
                console.log('Номер смены - '+this.shiftNumber);
                console.log('Время истечения (экспирации) смены - '+this.shiftExpiredAt);
                  //запрашиваем информацию о ФН
                  console.log('Запрос информации о фискальном накопителе...');
                  this.kkmAtolService.queryFnInfo(this.server_address,'status',this.device_server_uid).subscribe(
                    (data) => {
                      let responseFnInfo=data as any;
                      try{
                        this.fnSerial=responseFnInfo.fnInfo.serial; // серийный номер ФН
                        console.log('Номер ФН - '+this.fnSerial);
                        this.updateKkmOperation(operationId);
                      } catch (e) {//если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
                        console.log("Ошибка связи с кассой. Код ошибки - "+responseFnInfo.error.code+(responseFnInfo.error.code==166?" (фискальный накопитель не найден)":""));
                        if(responseFnInfo.error.code==166){ //166 = "ФН не найден"
                          //Если ФН не найден, то скорее всего взаимодействие с ККМ производится в режиме разработчика
                          //В данном случае за номер ФН берем произвольный номер, а номер смены тут не нужен, его будет получать из API сам бэкэнд (т.к. в случае отутствия ФН номер смены всегда = 0)
                          this.fnSerial="9999078900008855";
                          this.updateKkmOperation(operationId);
                        }
                      }
                    }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Нет связи с сервером "Атол web-сервер"'}})});



              } catch (e) {//если при выполнении данной строки происходит ошибка, значит загрузился JSON не по статусу 200, а сервер сгенерировал ошибку и статус 401, 403 или 404.
                console.log("Ошибка связи с кассой");
              }
            }, error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Нет связи с сервером "Атол web-сервер"'}})});
        } catch (e) {
          console.log("Ошибка связи с кассой");
        }
      }, error => {console.log(error);this.requestToServer=false;this.test_status= 'Нет связи с сервером "Атол web-сервер"';});
    }
  }

  //Зачем мы прокидываем operationId? К тому времени как дойдем до данного метода, глобальный operationId уже может измениться, т.к. сервер получит новое задание, и из глобального operationId нельзя брать значение. Нужно значение именно того operationId, который был во время отправки запроса getTaskStatus
  //Вообще это очень маловероятно, но теоретически может быть
  updateKkmOperation(operationId:string){
    console.log("Запись информации об операции ("+operationId+") на ККМ");
    let query:string = '';
    if(operationId=='openShift'||operationId=='closeShift'){
      query='/api/auth/updateShiftStatus'+
      '?zn_kkt='+this.zn_kkt+
      '&shiftStatusId='+this.shiftStatusId+
      '&shiftNumber='+this.shiftNumber+
      '&shiftExpiredAt='+this.shiftExpiredAt+
      '&companyId='+this.company_id+
      '&kassaId='+this.kassaId+
      '&fnSerial='+this.fnSerial;
    } else if(operationId=='sell'){
      query='/api/auth/addReceipt'+
      '?zn_kkt='+this.zn_kkt+
      '&shiftStatusId='+this.shiftStatusId+
      '&shiftNumber='+this.shiftNumber+
      '&shiftExpiredAt='+this.shiftExpiredAt+
      '&companyId='+this.company_id+
      '&docId='+this.docId+
      '&id='+this.id+
      '&kassaId='+this.kassaId+
      '&fnSerial='+this.fnSerial+
      '&operationId='+operationId+
      '&sno='+this.sno1_name_api_atol+//система налогообложения кассы (из паспорта кассы)
      '&billing_address='+ this.billingAddress+//место расчетов
      '&payment_type='+this.selectedPaymentType+ 
      '&cash='+(+this.nal_income-(+this.getChange()))+//расчет наличными = сколько внесли нала минус сдача
      '&electronically='+(+this.bnal_income);
    }
    this.http.get(query)
      .subscribe(
          (data) => 
          {   
            let result=data as number;
            console.log("Запись информации об операции ("+operationId+") успешно произведена");
            //если операцией был чек прихода
            if(operationId=='sell'){
              // эмитируем событие успешной печати чека, которое обработается в родительском документе
              console.log("Эмитирование события успешной печати чека для родительского модуля");
              this.succesfulChequePrinting.emit();
            }

          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}});this.kkmIsFree=true;}
      );
  }

  //нажата кнопка Отбить чек
  onClickPrintReceipt(){
  // при нажатии кнопки Отбить чек испускаем событие в родительский компонент
    console.log('Нажатие кнопки "Отбить чек"');
    if (this.kkmIsFree){
      console.log('Касса свободна.');
      this.kkmIsFree = false;
      this.onClickChequePrinting.emit();
    } else 
        this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Внимание!',message:"Касса занята."}})
    
  }

  // отправка на печать чека прихода/расхода/коррекции
  printReceipt(docId:number, id:number){ //docId - номер документа в реестре документов (таблица documents) от которого будет печататься чек, id - id документа (например, розничная продажа с id=102 передастся как "printReceipt(25,102)")
    let response: any;
    let uuid: string = this.getUUID();
    let cheque:any; //объект чека
    let chequeItem: any; //объект позиции в чеке
    let textItem: any //объект дополнительного элемента для вывода до печати документа
    let dividerItem: any = this.kkmAtolChequesService.getDividerItem(); //объект разделителя позиций в чеке
    let payment: any; //объект оплаты в чеке
    
    //чтобы не передавать параметрами по цепочке до метода updateKkmOperation, docId и id заносим в глобальные переменные данного класса, а в updateKkmOperation их оттуда получим:
    this.docId=docId;
    this.id=id;
    
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
    //забираем товарные позиции из компонента поиска и добавления товара
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
        this.bnal_income=this.totalSumPrice;
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
          this.getTaskStatus(uuid,1,1000,this.operationId);
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
          this.kkmIsFree=true;
        }
      }, 
      error => {
        console.log(error);
        this.kassa_status="Ошибка связи с сервером. Проверьте, запущен ли сервер Атол"
        this.kkmIsFree=true;
      }
    );
  } 

  //получает результат задания, опрашивая сервер по uuid задания. Опрашивает cnt раз, через time микросекунд
  //operationId прокидываем сюда, чтобы не было путаницы по ним во время частых обращений к ККМ-серверу, в т.ч. и рекурсивных, и каждому uuid соответствовала своя operationId
	//тем более что далее при успешности выполнения задания нужно исполнять onTaskSuccess и updateKkmOperation, куда так же по цепочке передаем operationId успешно выполненного задания
  getTaskStatus(uuid:string,cnt:number,time:number,operationId:string)
	{
    let maxTrying=3;
    let responseStatus:string;
    let response: any = null;
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
              this.onTaskSuccess(operationId);// запись в БД информации об открытии/закрытии смен, печати чеков
              this.getShiftStatus(); // для обновления состояния смены. Если запрос был по открытию или закрытию смены - статус смены обновится
              this.kkmIsFree=true;
              break;
            }
            case "error":{
              this.kassa_status="Задание выполнено с ошибкой: "+response.results[0].error.description;
              if(response.results[0].error.description=="Превышение длины реквизита") 
                this.kassa_status=this.kassa_status+". Возможно, введён неверный ИНН";
              this.kkmIsFree=true;
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
              this.kkmIsFree=true;
              break;
            }
            case "blocked":{
              this.kassa_status="Задание результат задания неизвестен, очередь выполнения остановлена. ";
              this.kkmIsFree=true;
              break;
            }
            case "canceled":{
              this.kassa_status="Задание прервано. ";
              this.kkmIsFree=true;
              break;
            }
          }
          this.cdRef.detectChanges();
          cnt++;
          if (cnt<=maxTrying && (responseStatus=='wait' || responseStatus=='inProgress')){
            console.log("Макс. количество попыток не использовано, статус - wait или inProgress")
            this.getTaskStatus(uuid,cnt,2000,operationId)
          }
          //данная ситуация может быть при потере связи с кассой
          if(cnt>maxTrying && (responseStatus=='wait' || responseStatus=='inProgress')) {
            console.log("Достигнуто макс. количество попыток, время ожидания завершения задания истекло, статус:"+responseStatus);
            this.kassa_status="Время ожидания завершения задания истекло";
            this.kkmIsFree=true;
          }
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
          if(+this.department_id>0)//если отделение выбрано - загружаем список доступных касс, иначе прерываем цепочку стартовых методов
              this.getKassaListByDepId();
            else{
              this.canWorkWithKassa=false;
              this.operationId='cantwork';
              this.operationName='Работа с кассой невозможна.';
            }
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
        error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error+' Возможно, введенные логин или пароль не верны, либо пользователь не имеет статус "Активный", либо пользователь не из этого предприятия. '}})}
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
            // на данном этапе, если отделение не выбрано, цепочка выполнения методов прерывается
            if(+this.department_id>0)
              this.getKassaListByDepId();
            else{
              this.canWorkWithKassa=false;
              this.operationId='cantwork';
              this.operationName='Работа с кассой невозможна. Отделение не выбрано.';
            }
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

  //заносит информацию об открытии смены в базу данных
  openShiftInDB(zn_kkt:string){
    this.http.get('/api/auth/openShiftInDB?zn_kkt='+zn_kkt)
      .subscribe(
          (data) => 
          {   
            let result=data as number;
          },
          error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})}
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
  }

  //определяет, можно ли пользователю работать с кассой
  setCanWorkWithKassa(onStart?:boolean){
    if(
      this.kassaList.length==0||//нет доступных пользователю касс (из его отделений, разрешенные к использованию и не удаленные - в kassaList загружаются только касы подходящие под эти условия):
      +this.kassaSettingsForm.get('selected_kassa_id').value==0 ||//если касса не выбрана
      !this.isKassaInList(this.kassaSettingsForm.get('selected_kassa_id').value) || //касса отсутствует в загруженном списке касс
      (this.kassaSettingsForm.get('cashier_value_id').value=='another'&&(this.anotherCashierFio==''||this.anotherCashierVatin==''))||//если выбрано "Другая учетная запись (custom)", но данных по ней нет
      this.cashierFio==''//кассир не выбран
      ) {
      this.canWorkWithKassa=false;
      this.operationId='cantwork';
      this.operationName='Работа с кассой невозможна.';
    } else {
      this.canWorkWithKassa=true;
      //если пользователь может работать с кассой - проверим, может ли работать сама касса))
      this.getShiftStatus(onStart);
    };
    // console.log('canWorkWithKassa - '+this.canWorkWithKassa);
  }

  isKassaInList(id:number):boolean{//определяет, есть ли касса с заданным id в загруженном списке касс
    let kassaInList: boolean = false; // У кассира может быть выбрана касса, которой уже нет в списке загруженных касс (например, кассу удалили)
    this.kassaList.map(i=>{
      if(i.id==id){
        kassaInList=true; 
      }
    });
    return kassaInList;
  }

  //берет значения по кассе (server_type, server_address, device_server_uid) из загруженного в getKassaListByDepId списка касс
  getKassaValues(){
    this.kassaList.map(i=>{
      if(i.id==this.kassaSettingsForm.get('selected_kassa_id').value){
        this.server_type=i.server_type; // тип сервера (атол или ккмсервер)
        this.device_server_uid=i.device_server_uid;// уник. идентификатор кассы на сервере
        this.server_address=i.server_address;//адрес сервера в сети
        this.sno1_name_api_atol=i.sno1_name_api_atol; //система налогообложения кассы
        this.kassaId = i.id; //id кассы
        this.company_id=i.company_id; //id предприятия кассы
        this.company_email=i.company_email; // email предприятия
        this.kassa_billing_address=i.billing_address; // адрес места растчетов
        this.zn_kkt=i.zn_kkt; //заводской номер ККТ
        this.onBillingAddressChange(); // если адрес места растчетов = "Как в настройках кассы", он будет kassa_billing_address
      }
    });
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

  //очищает поля "К оплате", "Наличными", "Сдача"
  clearFields(){
    this.totalSumPrice='0.00';
    this.nal_income='';
    this.bnal_income='0.00';
    this.nalInput.nativeElement.value='';
    this.getChange();
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
  //печать чека по нажатии Enter в поле Наличными
  chequeFromInput(){//если выполняются условия, при которых кнопка "Напечатать чек" активна, вызываем метод, который вызывается при нажатии на данную кнопку
    if(this.printChequeButtonIsActive){
      this.onClickPrintReceipt();
    }
  }
  onNalInputChange(){
    this.nal_income=this.nalInput.nativeElement.value;
  }
  // условия для активности кнопки "Напечатать чек"
  get printChequeButtonIsActive():boolean{
    return (!(!this.productTableIsValid || +this.totalSumPrice==0 || (((+this.totalSumPrice>(+this.nal_income + (+this.bnal_income))) || (+this.bnal_income>+this.totalSumPrice))&&this.selectedPaymentType!='electronically')))
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

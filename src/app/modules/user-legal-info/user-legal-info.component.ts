import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadSpravService } from '../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++
import { Observable, map, startWith } from 'rxjs';

export interface IdAndName {
  id: number;
  name_ru:string;
}

@Component({
  selector: 'app-user-legal-info',
  templateUrl: './user-legal-info.component.html',
  styleUrls: ['./user-legal-info.component.css'],
  providers: [LoadSpravService,]
})
export class UserLegalInfoComponent implements OnInit {getUserLegalInfo
  gettingData:boolean=false;
  mainForm: any; // форма со всей информацией 
  myCompanyId: number; // предприятие пользователя
  id:number; 
  permissionsSet: any[];//сет прав стартовой страницы
  allowToViewAllCompanies:boolean = false;
  filteredSpravSysJrCountries: Observable<IdAndName[]>; //массив для отфильтрованных Юр Страна
  spravSysCountries: IdAndName[] = [];// массив, куда будут грузиться все страны 
  editability=true;


  constructor(private http: HttpClient,
    public ThisDialogWindow: MatDialogRef<UserLegalInfoComponent>,
    public MessageDialog: MatDialog,
    private _snackBar: MatSnackBar,
    private loadSpravService:   LoadSpravService,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  ngOnInit(): void {
    //форма для сохранения настроек (настройки сохраняются в родительском модуле (dashboard), куда отправляются при закрытии диалога)
    this.mainForm = new UntypedFormGroup({
      
      jr_legal_form:  new UntypedFormControl        ('entity',[Validators.required]),
      jr_jur_name:  new UntypedFormControl          ('',[]),
      jr_name:  new UntypedFormControl              ('',[]),
      jr_surname:  new UntypedFormControl           ('',[]),
      jr_country_id:  new UntypedFormControl        (null,[Validators.required]),//Afghanistan
      jr_country:  new UntypedFormControl           ('',[]),
      jr_vat:  new UntypedFormControl               ('',[]),
      jr_changer_id:  new UntypedFormControl        ('',[]),
      jr_changer:  new UntypedFormControl           ('',[]),
      jr_date_time_changed:  new UntypedFormControl ('',[]),


    });

    this.filteredSpravSysJrCountries=this.mainForm.get('jr_country').valueChanges.pipe(startWith(''),map((value:string) => this.filter_jr_country(value)));

    this.getLegalMasterUserInfo();
    this.getSpravSysCountries();
  }

  get isFormValid(){
    if(+this.mainForm.get('jr_country_id').value>0 && 
        (
          (this.mainForm.get('jr_legal_form').value=='entity' && 
          this.mainForm.get('jr_jur_name').value!='') ||
          (this.mainForm.get('jr_legal_form').value=='individual' && 
          this.mainForm.get('jr_name').value!='' &&
          this.mainForm.get('jr_surname').value!='')
        )
    ) return true; 
    else return false;
  }

  get vatName(){  // VAT, Tax ID, PDV e.t.c
    if([47,212].includes(+this.mainForm.get('jr_country_id').value)) // if USA or US virgin lands
      return 'tax_id'; 
    if([17,185].includes(+this.mainForm.get('jr_country_id').value)) // if Montenegro, Serbia
      return 'pdv';
    else return 'vat';
  }
  //загрузка настроек. 
  //В данный момент из настроек присутствует только выбор предприятия, для которого будет загружаться информация во всех виджетах стартовой страницы
  getLegalMasterUserInfo(){
    this.gettingData=true;
    this.http.get('/api/auth/getLegalMasterUserInfo').subscribe
    (
      data => 
      { 
        let documentValues: any=data as any;
        if(data!=null&&documentValues.jr_legal_form!=null){
          if(documentValues.jr_legal_form!='')
            this.mainForm.get('jr_legal_form').setValue(documentValues.jr_legal_form);
          this.mainForm.get('jr_jur_name').setValue(documentValues.jr_jur_name);
          this.mainForm.get('jr_name').setValue(documentValues.jr_name);
          this.mainForm.get('jr_surname').setValue(documentValues.jr_surname);
          this.mainForm.get('jr_country_id').setValue(documentValues.jr_country_id);
          this.mainForm.get('jr_country').setValue(documentValues.jr_country);
          this.mainForm.get('jr_vat').setValue(documentValues.jr_vat);
        
        } else {this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.ne_perm')}})}
        this.gettingData=false;
        
      },
      error => console.log(error)
    );
  } 

  // Нужно отобразить список предприятий. Но что отображать - все предприятия главного аккаунта, или только своё предприятие?
  // Если у хотя бы одного виджета будет право на "Просмотр по всем предприятиям" - нужно отобразить все предприятия. 
  // Иначе - фильтруем список полученных предприятий главного аккаунта, и оставляем только своё
  
  onNoClick(): void {
    this.ThisDialogWindow.close();
  }
  
  private filter_jr_country(value: string): IdAndName[] {
    const filterValue = value?value.toLowerCase():'';
    return this.spravSysCountries.filter(option => option.name_ru.toLowerCase().includes(filterValue));
  }  

  getSpravSysCountries():void {   
    this.gettingData=true;
    this.http.post('/api/auth/getSpravSysCountries', {})  // 
    .subscribe((data) => {
      this.gettingData=false;
      this.spravSysCountries = data as IdAndName[];
      // this.spravSysJrCountries = data as IdAndName[];
    this.updateValuesSpravSysCountries(); },
    error => {this.gettingData=false;console.log(error)});
  }
  //если значение уже выбрано (id загрузилось), надо из массива объектов найти имя, соответствующее этому id 
  updateValuesSpravSysCountries(){
    if(+this.mainForm.get('jr_country_id').value!=0)
      {
        this.spravSysCountries.forEach(x => {
          if(x.id==this.mainForm.get('jr_country_id').value){
            this.mainForm.get('jr_country').setValue(x.name_ru);
          }
        })
      } 
      else //иначе обнулить поля id и имени. Без этого при установке курсора в поле список выскакивать не будет (х.з. почему так)
      {
        this.mainForm.get('jr_country').setValue('');
        this.mainForm.get('jr_country_id').setValue('');
      }
  }

  updateDocument(){
    this.gettingData=true;


    if(this.mainForm.get('jr_legal_form').value=='entity'){
      this.mainForm.get('jr_name').setValue('');
      this.mainForm.get('jr_surname').setValue('');
    } else {
      this.mainForm.get('jr_jur_name').setValue('');
      this.mainForm.get('jr_vat').setValue('');
    };

    this.http.post('/api/auth/updateLegalMasterUserInfo', this.mainForm.value)  // 
    .subscribe((data) => {
      
      let result:number=data as number;
      switch(result){
        case null:{// null возвращает если не удалось сохранить документ из-за ошибки
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.error_of') + (translate('docs.msg._of_save')) + translate('docs.msg._of_doc',{name:translate('docs.docs.company')})}});
          this.gettingData=false;
          break;
        }
        case -1:{// недостаточно прав
                 // not enought permissions
          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm')}});
          this.gettingData=false;
          break;
        }
        
        default:{// Успешно
          this.gettingData=false;
          this.openSnackBar(translate('docs.msg.doc_sved_suc'),translate('docs.msg.close'));
          this.ThisDialogWindow.close(true);
        }
      }                  
    
    },
    error => {this.gettingData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
  )}
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }
  checkEmptyJrCountryField(){
    if( this.mainForm.get('jr_country').value.length==0){
      this.mainForm.get('jr_country_id').setValue(null);
    }
  }
  clearField(field:string){
    this.mainForm.get(field).setValue('');
  }
}

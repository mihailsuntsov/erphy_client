import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/ui/dialogs/confirmdialog-with-custom-text.component';
import { translate } from '@ngneat/transloco'; //+++
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface Contact{
  id: number;
  company_id:     number;
  department_id:  number;
  additional:     string;   // eg. "Sales manager telephone"
  contact_type:   string;   // instagram/youtube/email/telephone
  contact_value:  string;   // eg. https://www.instagram.com/msuntsov
  display_in_os:  boolean;  // display or not this contact in online scheduling
  location_os:    string;   // where display this contact in Online scheduling - vertical list or horizontal icons
  output_order:   number;
}

export interface ContactType{
  name: string;
  value: string;
  placeholder: string;
  icon: string[]
}

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})

export class ContactsComponent {
  // @Input() contactsList: Contact[];
  @Input() companyId: number;
  @Input() departmentId: number;
  @Input() editability:boolean;
  formContacts:any;

  contactTypes:ContactType[]=[
    {
      name:'Email',
      value:'email',
      placeholder:'myname@postservice.com',
      icon: ['fas', 'envelope']
    },
    {
      name:'Phone',
      value:'telephone',
      placeholder:'+12223334455',
      icon: ['fas', 'phone']
    },
    {
      name:'Website',
      value:'website',
      placeholder:'www.mysite.com',
      icon:['fas', 'globe']
    },
    {
      name:'WhatsApp',
      value:'whatsapp',
      placeholder:'https://wa.me/12223334455',
      icon:['fab', 'whatsapp']
    },
    {
      name:'Instagram',
      value:'instagram',
      placeholder:'https://www.instagram.com/myinstagramnickname/',
      icon:['fab', 'instagram']
    },
    {
      name:'Facebook',
      value:'facebook',
      placeholder:'https://www.facebook.com/profile.php?id=100070105646282',
      icon:['fab', 'facebook']
    },
    {
      name:'Github',
      value:'github',
      placeholder:'https://github.com/mygithubnickname',
      icon:['fab', 'github']
    },
    {
      name:'StackOverflow',
      value:'stackoverflow',
      placeholder:'https://stackoverflow.com/users/1234567890/mynickname',
      icon:['fab', 'stack-overflow']
    },
    {
      name:'TikTok',
      value:'tiktok',
      placeholder:'https://www.tiktok.com/@mytiktok',
      icon:['fab', 'tiktok']
    },
    {
      name:'LinkedIn',
      value:'linkedin',
      placeholder:'https://www.linkedin.com/in/mylinkedin/',
      icon:['fab', 'linkedin']
    },
    {
      name:'PayPal',
      value:'paypal',
      placeholder:'https://paypal.me/YourName/XXX',
      icon:['fab', 'paypal']
    },
    {
      name:'YouTube',
      value:'youtube',
      placeholder:'https://www.youtube.com/@ERPHY-APP',
      icon:['fab', 'youtube']
    },
    {
      name:'Discord',
      value:'discord',
      placeholder:'https://discordapp.com/users/12345678901234567890',
      icon:['fab', 'discord']
    },
    {
      name:'Telegram',
      value:'telegram',
      placeholder:'https://t.me/mytelegram',
      icon:['fab', 'telegram']
    },
    {
      name:'x-twitter',
      value:'twitter',
      placeholder:'https://x.com/mytwitter',
      icon:['fab', 'x-twitter']
    },
    {
      name:'Viber',
      value:'viber',
      placeholder:'viber://add?number=12223334455',
      icon:['fab', 'viber']
    },
    {
      name:'VK',
      value:'vk',
      placeholder:'https://vk.com/myvkid',
      icon:['fab', 'vk']
    }
  ]

  constructor(
    private _fb: UntypedFormBuilder,
    public ConfirmDialog: MatDialog,
  ) { }

  ngOnInit(): void {

    this.formContacts = new UntypedFormGroup({
      onlineSchedulingContactsList:     new UntypedFormArray  ([]),
    });

  }

  fillContactsListFromApiResponse(contactsArray:Contact[]){
    const control = <UntypedFormArray>this.formContacts.get('onlineSchedulingContactsList');
    control.clear();
    contactsArray.forEach(row=>{
      control.push(this.formingContactRowFromApiResponse(row));
    });
  }

  formingContactRowFromApiResponse(row: Contact) {
    return this._fb.group({
      id:             new UntypedFormControl (row.id,[]),
      company_id:     new UntypedFormControl (row.company_id,     []),
      department_id:  new UntypedFormControl (row.department_id,     []),
      additional:     new UntypedFormControl (row.additional,     [Validators.maxLength(100)]),     // eg. "Sales manager telephone"
      contact_type:   new UntypedFormControl (row.contact_type,   [Validators.required, Validators.maxLength(50)]),   //instagram/youtube/email/telephone
      contact_value:  new UntypedFormControl (row.contact_value,  [Validators.required, Validators.maxLength(1000)]),   //  eg. https://www.instagram.com/msuntsov
      display_in_os:  new UntypedFormControl (row.display_in_os,  []),  // display or not this contact in online scheduling
      location_os:    new UntypedFormControl (row.location_os,    [Validators.maxLength(10)]),   // where display this contact in Online scheduling - vertical list or horizontal icons
      output_order:   new UntypedFormControl (row.output_order,   []),

    });
  }

  addNewContact() {
    const add = this.formContacts.get('onlineSchedulingContactsList') as UntypedFormArray;
    add.push(this._fb.group({
      id:             new UntypedFormControl (null,[]),
      company_id:     new UntypedFormControl (this.companyId,     []),
      department_id:  new UntypedFormControl (this.departmentId,     []),
      additional:     new UntypedFormControl ('',     [Validators.maxLength(100)]),     // eg. "Sales manager telephone"
      contact_type:   new UntypedFormControl ('telephone',   [Validators.required, Validators.maxLength(50)]),   //instagram/youtube/email/telephone
      contact_value:  new UntypedFormControl ('',  [Validators.required, Validators.maxLength(1000)]),   //  eg. https://www.instagram.com/msuntsov
      display_in_os:  new UntypedFormControl (true,  []),  // display or not this contact in online scheduling
      location_os:    new UntypedFormControl ('vertical',    [Validators.maxLength(10)]),   // where display this contact in Online scheduling - 'vertical' list or 'horizontal' icons
      output_order:   new UntypedFormControl (this.getContactsOutputOrder(),   []),
    }))
  }

  deleteContact(index: number) {
    const dialogRef = this.ConfirmDialog.open(ConfirmDialog, {
      width: '400px',
      data:
      { 
        head: translate('docs.msg.del_prod_item'),
        query: translate('docs.msg.del_query'),
        warning: '',
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result==1){
        const add = this.formContacts.get('onlineSchedulingContactsList') as UntypedFormArray;
        add.removeAt(index);
        this.setContactsOutputOrders();
      }
    });    
  }
  
  dropContact(event: CdkDragDrop<string[]>) {//отрабатывает при перетаскивании контакта
    //в массиве типа FormArray нельзя поменять местами элементы через moveItemInArray.
    //поэтому выгрузим их в отдельный массив, там поменяем местами а потом зальём обратно уже с нужным порядком
    let resultContainer: Contact[] = [];
    this.formContacts.get('onlineSchedulingContactsList').controls.forEach(m =>{
                      resultContainer.push({
                        id:             m.get('id').value,
                        company_id:     m.get('company_id').value,
                        department_id:  m.get('department_id').value,
                        additional:     m.get('additional').value,
                        contact_type:   m.get('contact_type').value,
                        contact_value:  m.get('contact_value').value,
                        display_in_os:  m.get('display_in_os').value,
                        location_os:    m.get('location_os').value,
                        output_order:   m.get('output_order').value,
                      })
                    });
    moveItemInArray(resultContainer, event.previousIndex, event.currentIndex);
    this.fillContactsListFromApiResponse(resultContainer);
    this.setContactsOutputOrders();//после того как переставили контакты местами - нужно обновить их очередность вывода (output_order)
  }

  getContactsOutputOrder(){//генерирует очередность для нового контакта
    const add = this.formContacts.get('onlineSchedulingContactsList') as UntypedFormArray; 
    return (add.length+1);
  }
  
  setContactsOutputOrders(){//заново переустанавливает очередность у всех контактов (при перетаскивании)
    let i:number=1;
    this.formContacts.get('onlineSchedulingContactsList').controls.forEach(m =>{
      m.get('output_order').setValue(i);
      i++;
    });
  }
  getControlTablefield(){
    const control = <UntypedFormArray>this.formContacts.get('onlineSchedulingContactsList');
    return control;
  }
  //возвращает таблицу товаров в родительский компонент для сохранения
  getContactsList(){
    return this.formContacts.value.onlineSchedulingContactsList;
  }
  getContactPlaceholder(contact_type:string){
    let result = '';
    this.contactTypes.map(type=>{
      if(type.value===contact_type){
        result=type.placeholder;
      }
    })
    return result;
  }
  insertExampleValue(index:number, contact_type:string){
    this.contactTypes.map(type=>{
      if(type.value===contact_type){
        this.getControlTablefield().controls[index].get('contact_value').setValue(type.placeholder);
      }
    })
  }
}

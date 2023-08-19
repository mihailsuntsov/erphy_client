import { Component, OnInit , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadSpravService } from '../../services/loadsprav';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { translate } from '@ngneat/transloco'; //+++
import { SanitizedHtmlPipe } from 'src/app/services/sanitized-html.pipe';
import { Observable, map, startWith } from 'rxjs';

interface PaymentMethod {
  id: number;
  name: string;
  img_address: string;
  output_order: number;
  link: string;
  is_active: boolean,
  description_msg_key: string;
}


export interface IdAndName {
  id: number;
  name_ru:string;
}

@Component({
  selector: 'app-payment-select',
  templateUrl: './payment-select.component.html',
  styleUrls: ['./payment-select.component.css'],
  providers: [LoadSpravService,SanitizedHtmlPipe]
})
export class PaymentSelectComponent implements OnInit {
  getPaymentSelect
  gettingData:boolean=false;
  mainForm: any; // форма со всей информацией 
  paymentMethodsList: PaymentMethod[]=[];
  link:string = '';
  paymentDescription='';

  constructor(private http: HttpClient,
    public ThisDialogWindow: MatDialogRef<PaymentSelectComponent>,
    public MessageDialog: MatDialog,
    private _snackBar: MatSnackBar,
    public sanitizedHtml:SanitizedHtmlPipe,
    @Inject(MAT_DIALOG_DATA) public data: any,) { }

  ngOnInit(): void {
    //форма для сохранения настроек (настройки сохраняются в родительском модуле (dashboard), куда отправляются при закрытии диалога)
    this.mainForm = new UntypedFormGroup({      
    });
    this.getPaymentMethodsList();
  }

  getPaymentMethodsList(){
    this.gettingData=true;
    this.http.get('/api/auth/getPaymentMethodsList').subscribe(
        (data) => { 
          this.paymentMethodsList=data as PaymentMethod [];
          this.gettingData=false;
        },
        error => {this.gettingData=false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})}
    );
  }

  onNoClick(): void {
    this.ThisDialogWindow.close();
  }
  
  onSelectPaymentMethod(method:PaymentMethod){
    this.paymentDescription=method.description_msg_key;
    this.link = method.link;
  }
 
  doPayment(){
    window.open( this.link, '_blank' );
    // window.location.href = this.link;
  }

}

import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , OnInit, Inject} from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { Validators, UntypedFormGroup, UntypedFormControl, FormBuilder} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { Observable, map } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EventEmitter } from '@angular/core';

interface Agreement{
    type: string;
    version: string;
    version_date: string;
    name: string;
    text: string;
}

@Component({
    selector: 'deletedialog',
    template:` 
    
    <mat-card class="card for-sticky-header" *transloco="let t" style="height: 100%;">

        <mat-spinner 
        strokeWidth="3" 
        class="spinner"
        [diameter]="50"
        *ngIf="gettingTableData"
        ></mat-spinner>

        <mat-card-title class="top-bar container-fluid" style="margin-bottom: -10px !important;"> 
            <div class="row" id="topBlock">
                <div class="card-name">
                    <span>{{t('docs.card.store_ordering')}}</span>
                </div>
                
                <button 
                    mat-raised-button 
                    color="accent"
                    (click)="onNoClick()"
                    class="button small-button"
                    style="margin-left: 5px! important;">
                    <i class="material-icons">close</i>
                </button>
            </div>
        </mat-card-title>
        <mat-card-content>












            <mat-stepper linear #stepper>
                <mat-step [stepControl]="firstFormGroup" label="{{t('docs.card.agreement')}}" [editable]="false">
                    <form [formGroup]="firstFormGroup">



                        <mat-card class="card for-sticky-header" style="height: 560px; margin-top: 10px;">
                            <mat-card-title class="top-bar container-fluid" style="margin-bottom: 0px !important;"> 
                                <div class="row" id="topBlock">
                                    <div class="card-name">
                                        <span>{{agreementName}}</span>
                                    </div>
                                </div>
                            </mat-card-title>
                            <mat-card-content>

                                <textarea   matInput 
                                            style="width:100%;"
                                            [rows]="26"
                                            [readonly]="true"
                                            [(ngModel)]="agreementText"
                                            [ngModelOptions]="{standalone: true}">
                                </textarea>


                                <div style="display:flex; margin-top:20px">
                                    <mat-checkbox class="example-margin" formControlName="agree" required>{{t('docs.button.i_agree')}}</mat-checkbox>

                                    <div *ngIf = "firstFormGroup.get('agree').value" style="width:50%">
                                        <button mat-button [disabled]="gettingTableData" 
                                        (click)="getMyRentSite()"
                                        style="background-color:#673ab7; color:white; position: absolute; right: 25px;"
                                        type="button" matStepperNext>{{t('docs.button.order_store')}}!</button>
                                    </div>
                                </div>


                            </mat-card-content>

                        </mat-card>






                    </form>
                </mat-step>
                <mat-step [stepControl]="secondFormGroup" label="{{t('docs.card.ready')}}!" [editable]="false">
                    <mat-card class="card for-sticky-header" style="height: 543px; margin-top: 10px;">
                        <mat-card-content>

                            

                        

                            <div style="heigth:100%; width:100%" [innerHTML]="text | sanitizedHtml"></div>
                    
                            
                                
                            

                        </mat-card-content>

                    </mat-card>
                </mat-step>
                
            </mat-stepper>


            <div style="width:100%; text-align: center;margin-top: -6px;">
                <a target="_blank" href="https://{{site_domain}}">
                    <button *ngIf = "site_domain!=''"
                        mat-raised-button 
                        color="accent"
                        class="button"
                        style="border-radius: 24px;
                            padding-left: 20px; padding-right: 20px;
                            width: auto; max-width: 100%;
                            border: 3px solid #673ab7;
                            height: 36px; line-height: normal;" >
                        
                            <i class="material-icons">language</i>
                            {{t('docs.button.btn_go_site')}}
                        
                    </button>
                </a>
            </div>
                
        </mat-card-content>
    </mat-card>
    `,
    styles: [` 
    .example-stepper {
        margin-top: 8px;
      }
    .card-name{ flex-grow: 1; }
    .spinner{
    position: absolute;
    top: 30%;
    left: 50%;
    margin-left: -25px;
    margin-top: 100px;
    z-index: 100;
    }
    .mat-mdc-form-field {
    margin-top: 16px;
    }
    `]
  })
  

  export class RentStoreOrderDialog  implements OnInit {

    firstFormGroup = this._formBuilder.group({
        agree: ['',[]],
        firstCtrl: ['', ],
      });
      secondFormGroup = this._formBuilder.group({
        secondCtrl: ['', Validators.required],
      });
    
    stepperOrientation: Observable<StepperOrientation>;
    agreement: Agreement;
    agreementName: string = '';
    agreementText: string = '';
    gettingTableData = true;
    site_domain = '';
    getStoreDataAfterDialogClose=false;
    text='';

    onGetOnlineStore = new EventEmitter();

    // result:SafeHtml;
    constructor(
        private _snackBar: MatSnackBar,
        private sanitized: DomSanitizer,
        private http:HttpClient, 
        public MessageDialog: MatDialog,
        public dialogRef: MatDialogRef<RentStoreOrderDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _formBuilder: FormBuilder, breakpointObserver: BreakpointObserver
    ) {this.stepperOrientation = breakpointObserver
        .observe('(min-width: 800px)')
        .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
    }
      
    onNoClick(): void {
        // this.dialogRef.close(this.getStoreDataAfterDialogClose);
        this.dialogRef.close(true);
    }
    close(): void {
        this.dialogRef.close(true); //on close pass data to parent
    }
    ngOnInit() {
        
        //console.log("productId:"+this.data.productId);
        this.getLastVersionAgreement();
        // this.result = this.sanitized.bypassSecurityTrustHtml(this.text)
    }

    getLastVersionAgreement(){ 
        this.gettingTableData = true;   
        this.http.get('/api/auth/getLastVersionAgreement?type=site_hosting')
            .subscribe(
                data => { 

                    switch(data){
                        case null:{
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.error_msg')}});
                          break;
                        }
                        default:{
                          this.agreement     = data as Agreement; 
                          this.agreementName = this.agreement.name;
                          this.agreementText = this.agreement.text;
                          break;
                        }
                    }
                    this.gettingTableData = false;                    
                },
                error => {this.gettingTableData = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            );
    }

    getMyRentSite(){ 
        this.gettingTableData = true;   
        // iagree           boolean iagree,
        // companyId        Long companyId,
        // storeId          Long storeId,
        // agreementType    String agreementType,
        // agreementVer     String agreementVer
        this.http.get('/api/auth/getMyRentSite?'+
        'iagree='+this.firstFormGroup.get('agree').value+
        '&companyId='+this.data.companyId+
        '&storeId='+this.data.storeId+
        '&agreementType='+this.agreement.type+
        '&agreementVer='+this.agreement.version
        )
            .subscribe(
                data => {
                    let result = data as any;
                    switch(result.result){
                        case null:{ //Error
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.error_msg')}});
                          break;
                        }
                        case -1:{  // Недостаточно прав для данной операции
                                   // Not enougth permissions
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.ne_perm_creat')}});
                          break;
                        }
                        case -320:{ // Не получено согласие на предоставление услуги
                                    // Consent to the service agreement not received
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.320')}});
                          break;
                        }
                        case -330:{ // Нет свободных сайтов для аренды
                                    // No free sites to rent
                          this.text = result.message;                          
                          this.onGetOnlineStore.emit(true);
                          break;
                        }
                        case -340:{ // Данное подключение уже имеет привязанный к нему действующий интернет-магазин
                                    // This connection already has an active online store linked to it
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.340')}});
                          break;
                        }
                        case -350:{ // Превышено максимально допустимое количество интернет-магазинов, которые можно заказать за 24 часа с одного аккаунта
                                    // Exceeded the maximum allowable quantity of online stores that can be ordered in 24h from one account
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.350')}});
                          break;
                        }
                        case -351:{ // Превышено максимально допустимое количество интернет-магазинов, которые можно заказать за 24 часа с одного IP-адреса
                                    // Exceeded the maximum allowable quantity of online stores that can be ordered in 24h from one IP address
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.351')}});
                          break;
                        }
                        default:{
                          this.text = result.message;
                          this.site_domain = result.storeInfo.site_domain;
                          this.getStoreDataAfterDialogClose=true;
                          this.onGetOnlineStore.emit(true);
                          break;
                        }
                    }
                    this.gettingTableData = false;                    
                },
                error => {this.gettingTableData = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            );
    }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
          duration: 3000,
        });
    } 


  }
  
import {MatDialogRef,MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Component , OnInit, Inject, ViewChild, NgZone} from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { MatSnackBar} from '@angular/material/snack-bar';
import { Validators, UntypedFormGroup, UntypedFormControl, FormBuilder} from '@angular/forms';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { translate } from '@ngneat/transloco'; //+++
import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { Observable, map } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { EventEmitter } from '@angular/core';
import { SanitizedHtmlPipe } from 'src/app/services/sanitized-html.pipe';

interface RentStoreOrder{
    iagree: boolean;
    companyId: number;
    storeId :number;
    agreementType: string;
    thirdLvlName: string;
    agreementVer: string;
    existedStoreVariation: boolean;
    parentVarSiteId: number;
    position: string;
    varName: string;
}
interface Agreement{
    type: string;
    version: string;
    version_date: string;
    name: string;
    text: string;
}
interface IdAndName {
  id: number;
  name:string;
}
@Component({
    providers: [SanitizedHtmlPipe],
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
                                    <button 
                                        mat-raised-button 
                                        color="primary"
                                        [disabled]="!firstFormGroup.get('agree').value" 
                                        style="position: absolute; right: 25px;"
                                        type="button"
                                        mat-button matStepperNext>
                                        {{t('docs.button.next')}}
                                    </button>
                                    

                                </div>

                            </mat-card-content>

                        </mat-card>






                    </form>
                </mat-step>

                <mat-step [stepControl]="secondFormGroup" label="{{t('docs.field.site_name')}}" [editable]="false">
                    <form [formGroup]="secondFormGroup">



                        <mat-card class="card for-sticky-header" style="height: 560px; margin-top: 10px;">
                            
                            <mat-card-title class="top-bar container-fluid" style="margin-bottom: 0px !important;"> 
                                <div class="row" id="topBlock">
                                    <div class="card-name">
                                        <span>{{t('docs.field.site_name')}}</span>
                                    </div>
                                </div>
                            </mat-card-title>
                            <mat-card-content>
                            <!--**--{{secondFormGroup.get('thirdLvlName').value.length}}--**--{{secondFormGroup.get('thirdLvlName').value.length>0 && secondFormGroup.get('thirdLvlName').touched && secondFormGroup.get('thirdLvlName').invalid}}-->
                                <div id="site_name" style="text-align:center; height:417px; width:100%">
                                    <mat-form-field 
                                    *ngIf="!secondFormGroup.get('existedStoreVariation').value"
                                    style="margin-top: 80px;width:100%;max-width: 400px;
                                    align-items: baseline;
                                    box-sizing: border-box;">
                                        <input type="texts"
                                        (keypress)="numbersAndLettersOnly($event)"
                                        (keyup)="isSiteNameAllowed()"
                                        matInput
                                        #thirdLvlName
                                        style="width:100%"
                                        maxlength="30"
                                        placeholder="{{'docs.field.site_name' | transloco}}" 
                                        formControlName="thirdLvlName"  
                                        [ngClass]="{'is-invalid':secondFormGroup.get('thirdLvlName').value.length>0 && secondFormGroup.get('thirdLvlName').touched && secondFormGroup.get('thirdLvlName').invalid}"
                                        />
                                        
                                        <span matTextSuffix>.{{data.rootDomain}}</span>
                                        <mat-hint *ngIf="secondFormGroup.get('thirdLvlName').touched && secondFormGroup.get('thirdLvlName').invalid">
                                            <i *ngIf="secondFormGroup.get('thirdLvlName').errors.minlength" class="form-invalid">{{'docs.error.too_short' | transloco}}<br></i>
                                            <i *ngIf="secondFormGroup.get('thirdLvlName').errors.maxlength" class="form-invalid">{{'docs.error.too_long' | transloco}}<br></i>
                                        </mat-hint>
                                       
                                    </mat-form-field>
                                    <mat-progress-bar *ngIf="isNameUnicalChecking" style="display: inline-block;width:100%;max-width: 400px;top: -23px;" mode="indeterminate"></mat-progress-bar>
                                
                                    <mat-form-field 
                                        *ngIf="secondFormGroup.get('existedStoreVariation').value"
                                        style="margin-top: 80px; width:100%; max-width: 400px;
                                        align-items: baseline;
                                        box-sizing: border-box;">
                                        {{data.lang_code}}.
                                        <mat-label>{{t('docs.field.extd_sites')}}</mat-label>
                                        <mat-select  formControlName="parentVarSiteId">                          
                                            <mat-option  *ngFor="let rt of existedRentSitesList" [value]="rt.id">
                                                {{rt.name}}
                                            </mat-option> 
                                        </mat-select>
                                        
                                    </mat-form-field>

                                    <mat-checkbox *ngIf="existedRentSitesList.length>0" class="example-margin" style="width: 100%;" formControlName="existedStoreVariation">{{t('docs.field.lv_extd_sites')}}</mat-checkbox>

                                    <div style="heigth:100%; width:100%; margin-top:15px;color: gray;" [innerHTML]="site_name_access | sanitizedHtml"></div>

                                </div>

                                

                                <div style="display:flex; margin-top:20px">
                                    <div style="width:50%">
                                    </div>
                                    <div style="width:50%">
                                        <button mat-raised-button color="primary"
                                        [disabled]="(gettingTableData || secondFormGroup.get('thirdLvlName').invalid || !nameIsChecked) && !secondFormGroup.get('existedStoreVariation').value"
                                        (click)="getMyRentSite()"
                                        style="position: absolute; right: 25px;"
                                        type="button">{{t('docs.button.order_store')}}!</button>
                                        <!--button mat-raised-button color="primary"
                                        
                                        (click)="next()"
                                        style="position: absolute; right: 25px;"
                                        type="button">{{t('docs.button.order_store')}}!</button-->
                                    </div>
                                </div>



                            </mat-card-content>

                        </mat-card>






                    </form>
                </mat-step>


                <mat-step [stepControl]="thirdFormGroup" label="{{t('docs.card.ready')}}!" [editable]="false">
                    <mat-card class="card for-sticky-header" style="height: 543px; margin-top: 10px;">
                        <mat-card-content>

                            

                        

                            <div style="heigth:100%; width:100%" [innerHTML]="text | sanitizedHtml"></div>
                    
                            
                                
                            

                        </mat-card-content>

                    </mat-card>
                </mat-step>
                
            </mat-stepper>


            <div style="width:100%; text-align: center;margin-top: -6px;">
                <a target="_blank" href="https://{{site_url}}">
                    <button *ngIf = "site_url!='' && isStoreGettingSuccessful"
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
    <!--code><pre>{{firstFormGroup.value | json}}</pre></code-->
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
    ::ng-deep #site_name .mat-form-field-infix {
        display: inline-flex !important;
        align-items: baseline;
        font-size: xx-large;
        box-sizing: border-box;
        width: 100%;
    }
    `]
  })
  

  export class RentStoreOrderDialog  implements OnInit {
    // secondFormGroup:any;


    firstFormGroup = this._formBuilder.group({
        agree:      [false,[]],
    });
    secondFormGroup = this._formBuilder.group({
        thirdLvlName:       ['', [Validators.maxLength(30), Validators.minLength(2), Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_\.]{1,20}$')]],
        existedStoreVariation:              false,
        parentVarSiteId:    [null],
        position:           'before',
        varName:            ''
    });

    thirdFormGroup = this._formBuilder.group({
    //     thirdCtrl: ['', Validators.required],
    });
    
    stepperOrientation: Observable<StepperOrientation>;
    agreement: Agreement;
    agreementName: string = '';
    agreementText: string = '';
    gettingTableData = true;
    site_url = '';
    getStoreDataAfterDialogClose=false;
    text='';
    site_name_access=''; // Notification on the stage of selectiong site name
    isNameUnicalChecking = false;
    lastCheckedSiteName:string=''; //!!!
    nameIsChecked=false;
    existedRentSitesList:IdAndName[] = [];
    isStoreGettingSuccessful=false; // to show or not to show the button "Go to my site"
    onGetOnlineStore = new EventEmitter();
    @ViewChild('stepper') private myStepper: MatStepper;
    
    // result:SafeHtml;
    constructor(
        private _snackBar: MatSnackBar,
        // private sanitized: DomSanitizer,
        private ngZone: NgZone,
        public sanitizedHtml:SanitizedHtmlPipe,
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
        this.getSiteNameAccessMsg();
        this.getExistedRentSitesList();
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
    getExistedRentSitesList(){ 
        this.gettingTableData = true;   
        this.http.get('/api/auth/getExistedRentSitesList?company_id='+this.data.companyId)
            .subscribe(
                data => { 
                    this.existedRentSitesList = data as IdAndName[];
                    switch(this.existedRentSitesList){
                        case null:{
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.msg.error_msg')}});
                          break;
                        }default:{
                            if(this.existedRentSitesList.length>0)
                                this.secondFormGroup.get('parentVarSiteId').setValue(this.existedRentSitesList[0].id);
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
        
        let rentStoreOrder: RentStoreOrder = {
            iagree: this.firstFormGroup.get('agree').value,
            companyId: this.data.companyId,
            storeId :this.data.storeId,
            agreementType: this.agreement.type,
            thirdLvlName: this.secondFormGroup.get('thirdLvlName').value,
            agreementVer: this.agreement.version,
            existedStoreVariation: this.secondFormGroup.get('existedStoreVariation').value,
            parentVarSiteId: this.secondFormGroup.get('parentVarSiteId').value,
            position: 'before',
            varName: this.data.lang_code
        }
        if(!rentStoreOrder.existedStoreVariation){// if it is not a variation of an existed store
            rentStoreOrder.parentVarSiteId=null;
            rentStoreOrder.position=null;
            rentStoreOrder.varName=null;
        } else rentStoreOrder.thirdLvlName=null;
        
        this.http.post('/api/auth/getMyRentSite', rentStoreOrder).subscribe(
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
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.error.320')}});
                          break;
                        }
                        case -330:{ // Нет свободных сайтов для аренды
                                    // No free sites to rent
                                    this.text = result.message;
                                    this.site_url = result.storeInfo.site_url;
                                    this.next();  
                          break;
                        }
                        case -340:{ // Данное подключение уже имеет привязанный к нему действующий интернет-магазин
                                    // This connection already has an active online store linked to it
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.error.340')}});
                          break;
                        }
                        case -350:{ // Превышено максимально допустимое количество интернет-магазинов, которые можно заказать за 24 часа с одного аккаунта
                                    // Exceeded the maximum allowable quantity of online stores that can be ordered in 24h from one account
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.error.350')}});
                          break;
                        }
                        case -351:{ // Превышено максимально допустимое количество интернет-магазинов, которые можно заказать за 24 часа с одного IP-адреса
                                    // Exceeded the maximum allowable quantity of online stores that can be ordered in 24h from one IP address
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.error.351')}});
                          break;
                        }
                        case -370:{ // Один и тот же сайт не может иметь одинаковые языковые версии
                                    // The same site cannot have the same language versions (e.g. mystore.me/fr is already existed, & mystore.me/fr creation -> error)
                          this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.attention'),message:translate('docs.error.370')}});
                          break;
                        }
                        default:{
                            this.text = result.message;
                            this.site_url = result.storeInfo.site_url;
                            this.next();  
                            this.isStoreGettingSuccessful=true;
                        }
                    }
                    this.gettingTableData = false;                    
                },
                error => {this.gettingTableData = false;console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
            );
    }
    next(){

    //    1. В бэкэнде заполнять в таблице сайтов domain_name для заказов без сайтов как flowers.dokio.me
    //    2. Заполнять getSite_url
    //    3. Изменить css классы чтобы поле "Existed sites" смотрелось органично

        this.getStoreDataAfterDialogClose=true;
        this.onGetOnlineStore.emit(true);
        this.myStepper.next();
    }
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action, {
          duration: 3000,
        });
    } 
    getSiteNameAccessMsg(){
        this.http.get('/api/auth/translateHTMLmessage?key=site_name_access')
        .subscribe(
            data => {
                let result=  data as any;
                this.site_name_access = result.result;
            },
            error => {console.log(error);this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('menu.msg.error'),message:error.error}})}
        );
    }

    isSiteNameAllowed() { //+++
        let nameTmp=this.secondFormGroup.get('thirdLvlName').value;
        this.nameIsChecked=false;
        setTimeout(() => {
          if(!this.secondFormGroup.get('thirdLvlName').errors && this.lastCheckedSiteName!=nameTmp && nameTmp!='' && nameTmp==this.secondFormGroup.get('thirdLvlName').value)
            {
              let Unic: boolean;
              this.isNameUnicalChecking=true;
              this.lastCheckedSiteName=nameTmp;
              return this.http.get('/api/auth/isSiteNameAllowed?name='+this.secondFormGroup.get('thirdLvlName').value)
              .subscribe(
                  (data) => {   
                            Unic = data as boolean;
                            if(!Unic)
                                this.MessageDialog.open(MessageDialog,{width:'400px',data:{head: translate('docs.msg.attention'),message: translate('docs.msg.site_name_n_allwd'),}});
                            else
                                this.nameIsChecked=true;
                            this.isNameUnicalChecking=false;
                          },
                  error => {console.log(error);this.isNameUnicalChecking=false;}
              );
            }
        }, 1000);
    }
    
    numbersAndLettersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;//т.к. IE использует event.keyCode, а остальные - event.which
        console.log('charCode = ' + charCode);
        if ((charCode >= 48 && charCode <= 57)||(charCode >= 97 && charCode <= 122)) { return true; } return false;}
  }
  
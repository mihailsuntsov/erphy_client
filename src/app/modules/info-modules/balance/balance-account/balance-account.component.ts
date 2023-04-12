import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { translate } from '@ngneat/transloco'; //+++
import { MoneyflowDetComponent } from 'src/app/modules/info-modules/moneyflow_det/moneyflow_det.component';

@Component({
  selector: 'app-balance-account',
  templateUrl: './balance-account.component.html',
  styleUrls: ['./balance-account.component.css'],
  providers: [CommonUtilitesService]
})
export class BalanceAccountComponent implements OnInit, OnChanges {

  balanceLoading: boolean=false; // идет загрузка баланса
  balance:number=null;
  showModule=true;

  @Input() company_id:    number;
  @Input() account_id:  number;
  @Input() currency:      string;
  @Output() successfullGetAccountBalance = new EventEmitter<any>(); //событие успешного получения баланса

  constructor(
    private http: HttpClient,
    public MessageDialog: MatDialog,
    public moneyflowDetDialog: MatDialog,
    public commonUtilites: CommonUtilitesService,) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.account_id) {
      this.getBalance();
    }
  }

  //возвращает баланс по кассе, р.счёту или контрагенту
  getBalance(){
    if(this.company_id!=null && this.account_id!=null && +this.company_id!=0 && +this.account_id!=0){
      this.balanceLoading=true;
      this.balance=null;
      this.http.get('/api/auth/getAccountBalance?companyId='+this.company_id+'&typeId='+this.account_id) 
      .subscribe(
          (data) => 
          {  
            if(data!=null){
              this.balanceLoading=false;
              this.balance=parseFloat(data.toString()); 
              this.successfullGetAccountBalance.emit();
              // this.refresh();
            } else {
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.blnc_quer_err')}})
            }
          },
          error => {this.balanceLoading=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
    } else this.balance=null;
  }
    
  openDetailsWindow() {
    this.moneyflowDetDialog.open(MoneyflowDetComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      height: '95%',
      width: '95%',
      data:
      { 
        mode: 'viewInWindow',
        date: null,
        companyId: this.company_id,
        locale:null,
        myId:0,
        myCompanyId:0,
        companiesList:[],
        dateFormat:null,
        accountsIds: [this.account_id],
        boxofficesIds: [],
        // dateFrom:this.queryForm.get('dateFrom').value,
        // dateTo:this.queryForm.get('dateTo').value,
        // cagent:cagent,
      },
    });
   }

  refresh(){
    this.showModule=false;
    // alert(this.showModule)
    setTimeout(() => {this.showModule=true; }, 1000);
  }



}

import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';
import { translate } from '@ngneat/transloco'; //+++

@Component({
  selector: 'app-balance-kassa',
  templateUrl: './balance-kassa.component.html',
  styleUrls: ['./balance-kassa.component.css'],
  providers: [CommonUtilitesService]
})
export class BalanceKassaComponent implements OnInit, OnChanges {

  balanceLoading: boolean=false; // идет загрузка баланса
  balance:number=null;
  showModule=true;

  @Input() company_id:    number;
  @Input() kassa_id:      number;
  @Input() currency:      string;

  constructor(
    private http: HttpClient,
    public MessageDialog: MatDialog,
    public commonUtilites: CommonUtilitesService,) { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.kassa_id) {
      this.getBalance();
    }
  }

  //возвращает баланс по кассе, р.счёту или контрагенту
  getBalance(){
    if(this.company_id!=null && this.kassa_id!=null){
      this.balanceLoading=true;
      this.balance=null;
      this.http.get('/api/auth/getKassaBalance?companyId='+this.company_id+'&typeId='+this.kassa_id) 
      .subscribe(
          (data) => 
          {  
            if(data!=null){
              this.balanceLoading=false;
              this.balance=parseFloat(data.toString()); 
              // this.refresh();
            } else {
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:translate('docs.msg.blnc_quer_err')}})
            }
          },
          error => {this.balanceLoading=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:translate('docs.msg.error'),message:error.error}})},
      );
    } else this.balance=null;
  }
    
  refresh(){
    this.showModule=false;
    // alert(this.showModule)
    setTimeout(() => {this.showModule=true; }, 1000);
  }



}

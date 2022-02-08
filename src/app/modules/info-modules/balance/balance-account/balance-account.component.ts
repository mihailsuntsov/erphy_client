import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageDialog } from 'src/app/ui/dialogs/messagedialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonUtilitesService } from 'src/app/services/common_utilites.serviсe';

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

  constructor(
    private http: HttpClient,
    public MessageDialog: MatDialog,
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
              // this.refresh();
            } else {
              this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:'Ошибка запроса баланса'}})
            }
          },
          error => {this.balanceLoading=false;this.MessageDialog.open(MessageDialog,{width:'400px',data:{head:'Ошибка!',message:error.error}})},
      );
    } else this.balance=null;
  }
    
  refresh(){
    this.showModule=false;
    // alert(this.showModule)
    setTimeout(() => {this.showModule=true; }, 1000);
  }



}

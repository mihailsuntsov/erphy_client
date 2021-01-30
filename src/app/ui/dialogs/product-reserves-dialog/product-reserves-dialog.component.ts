import { Component, OnInit , Inject, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { HttpClient} from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-product-reserves-dialog',
  templateUrl: './product-reserves-dialog.component.html',
  styleUrls: ['./product-reserves-dialog.component.css']
})
export class ProductReservesDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<any>(); //массив данных для таблицы и чекбоксов (чекбоксы берут из него id, таблица -всё)
  gettingTableData:boolean=false;
  displayedColumns: string[] = ['opendoc','doc_number','creator','non_shipped','description','department','shipment_date','date_time_created','status'];//массив отображаемых столбцов таблицы
  constructor(
    private http: HttpClient,
    public ProductReservesDialog: MatDialogRef<ProductReservesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onNoClick(): void {
    this.ProductReservesDialog.close();
   }

  ngOnInit(): void {
    this.getReservesTable();
  }

  getReservesTable(){
    this.gettingTableData=true;
    this.http.get('/api/auth/getReservesTable?department_id='+this.data.departmentId+'&product_id='+this.data.productId+'&company_id='+this.data.companyId+'&document_id='+this.data.documentId)
     .subscribe(
         data => { 
           this.dataSource.data = data as any [];
           this.gettingTableData=false;
         },
         error => {console.log(error);this.gettingTableData=false;}
     );
 }


}

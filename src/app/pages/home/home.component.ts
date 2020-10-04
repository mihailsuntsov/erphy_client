import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PagesService } from '../../services/pages.service';
import { GetPageForm } from '../../services/query-forms/get-page.form';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [PagesService]
})
export class HomeComponent implements OnInit 
{
  title = 'dokio';
  getPageForm: GetPageForm=new GetPageForm();
  receivedHtmlPage: string;
  content: string;
  id1:any;
  id2:any;
  
  constructor(
    private activateRoute: ActivatedRoute,
    private pagesService: PagesService
  )
  { 
    console.log(this.activateRoute);

  }

  ngOnInit() {


    };

  

}

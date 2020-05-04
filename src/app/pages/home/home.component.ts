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
  title = 'dokiosite';
  getPageForm: GetPageForm=new GetPageForm();
  receivedHtmlPage: string;
  content: string;
  
  constructor(
    private activateRoute: ActivatedRoute,
    private pagesService: PagesService
  )
  { 
    console.log(this.activateRoute);

  }

  ngOnInit() {

      this.getHtmlPage();
    };

  getHtmlPage(){

    this.getPageForm.domain="printani.ru";
    this.getPageForm.uid="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    this.getPageForm.parameter="";
    this.getPageForm.route_id=1;

    this.pagesService.getHtmlPage(this.getPageForm)
            .subscribe(
                (data) => {
                  this.receivedHtmlPage=data as string ; 
                  console.log("receivedHtmlPage - "+this.receivedHtmlPage);
                },
                error => console.log(error) 
            );
  }


}

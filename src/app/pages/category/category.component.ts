import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PagesService } from '../../services/pages.service';
import { GetPageForm } from '../../services/query-forms/get-page.form';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  providers: [PagesService]
})
export class CategoryComponent implements OnInit 
{
  id: number;// id документа
  getPageForm: GetPageForm=new GetPageForm();
  receivedHtmlPage: string;
  content: string;

  constructor(
    private activateRoute: ActivatedRoute,
    private pagesService: PagesService
  )
  { 
    console.log(this.activateRoute);
    this.id = +activateRoute.snapshot.params['id'];// +null returns 0
  }

  ngOnInit() {
      this.showId();
      this.getHtmlPage();
      // this.loadContent();
    };

  showId():void{
    console.log("id or alias - "+this.id);
  }

  getHtmlPage(){

    this.getPageForm.domain="printani.ru";
    this.getPageForm.uid="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    this.getPageForm.parameter="110";
    this.getPageForm.route_id=2;

    this.pagesService.getHtmlPage(this.getPageForm)
            .subscribe(
                (data) => {
                  this.receivedHtmlPage=data as string ; 
                  console.log("receivedHtmlPage - "+this.receivedHtmlPage);
                },
                error => console.log(error) 
            );
  }

  // loadContent(){
  //   this.content = '<h1>\n  Загруженный контент HTML-страницы "О НАС", содержащей встроенные компоненты.\n</h1>\n<h2>А это сам встроенный компонент:</h2>\n<example-component name="hello">Контент, переданный в example-компонент.</example-component>\n<h2>А это второй встроенный компонент:</h2>\n<example2-component name="hello">Контент, переданный в example2-компонент.</example2-component>';
  // }

}

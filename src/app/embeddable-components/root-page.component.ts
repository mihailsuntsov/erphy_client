import { Component } from '@angular/core'
import { PagesService } from '../services/pages.service';

@Component({
  selector: 'root-page-component',
  template: `<content-viewer [content]="insidecontent" ></content-viewer>`,
  providers: [PagesService]
})

export class RootPageComponent {

  name: string;
  insidecontent: string;

  constructor(
    private pagesService: PagesService
  ){}

  ngOnInit(){

    console.log(`RootPageComponent.OnInit name=`, this.name);
    this.getTemplatePage();
    // this.insidecontent=;
  }

  getTemplatePage(){

    this.pagesService.getTemplatePage()
            .subscribe(
                (data) => {
                  this.insidecontent=data as string ; 
                  // console.log("insidecontent - "+this.insidecontent);
                },
                error => console.log(error) 
            );
  }


}

import { Component } from '@angular/core'

@Component({
  selector: 'root-page-component',
  template: `<content-viewer [content]="insidecontent" ></content-viewer>`,
})

export class RootPageComponent {

  name: string;
  insidecontent: string;

  ngOnInit(){

    console.log(`RootPageComponent.OnInit name=`, this.name);
    
    this.insidecontent='<br><br><br>';
    this.insidecontent+='[Начало root-page-компонента';
    this.insidecontent+='<menu-component name="simple"></menu-component>';
    this.insidecontent+='<div>';
    this.insidecontent+='<p>в каком-то диве вызывается роутер-аутлет:</p>';
    this.insidecontent+='<router-outlet-component></router-outlet-component></a>';
    this.insidecontent+='</div>';
    this.insidecontent+='Конец root-page-компонента]';
    
  }
}

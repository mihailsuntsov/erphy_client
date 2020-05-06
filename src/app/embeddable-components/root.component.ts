import { Component } from '@angular/core'

@Component({
  selector: 'root-component',
  template: `<content-viewer [content]="insidecontent" ></content-viewer>`,
})

export class RootComponent {

  name: string;
  insidecontent: string;

  ngOnInit(){

    console.log(`RootComponent.OnInit name=`, this.name);

    this.insidecontent='<br><br><br><br><br><br>';
    this.insidecontent+='[Начало root-компонента';
    this.insidecontent+='<menu-component name="simple"></menu-component>';
    this.insidecontent+='<div>';
    this.insidecontent+='<p>в каком-то диве вызывается роутер-аутлет:</p>';
    this.insidecontent+='<router-outlet></router-outlet>';
    this.insidecontent+='</div>';
    this.insidecontent+='Конец root-компонента]';
    
  }
}

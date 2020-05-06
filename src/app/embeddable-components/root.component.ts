import { Component } from '@angular/core'

@Component({
  selector: 'root-component',
  template: `<br><br><br><br><br><br>
[Начало root-компонента
  <menu-component name="simple"></menu-component>
  <div>
    <p>в каком-то диве вызывается роутер-аутлет:</p>
    <content-viewer [content]="insidecontent" ></content-viewer><br />
  </div>
  Конец root-компонента
]
  `,
})
export class RootComponent {
  name: string;
  insidecontent: string;
  ngOnInit(){
    console.log(`RootComponent.OnInit name=`, this.name)
    this.insidecontent='<example2-component></example2-component></a>';
  }
}

import { Component } from '@angular/core'

@Component({
  selector: 'example-component',
  template: `<br><br><br><br><br><br>
[Начало example-компонента
  <ng-content></ng-content><br> 

  <content-viewer [content]="insidecontent" ></content-viewer><br />
  Конец example-компонента
]
  `,
})
export class ExampleComponent {
  name: string;
  // insidecontent: string='<example2-component name="hello333">Контент, переданный в example2-компонент из example-компонента.</example2-component>';
  insidecontent: string='';
  ngOnInit(){
    console.log(`ExampleComponent.OnInit name=`, this.name)

  }
}

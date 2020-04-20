import { Component } from '@angular/core'

@Component({
  selector: 'example-component',
  template: `
[Начало example-компонента<br><ng-content></ng-content><br> 

  <content-viewer [content]="insidecontent" ></content-viewer><br />
  Конец example-компонента
]
  `,
})
export class ExampleComponent {
  name: string;
  insidecontent: string='<example2-component name="hello333">Контент, переданный в example2-компонент из example-компонента.</example2-component>';
  ngOnInit(){
    console.log(`ExampleComponent.OnInit name=`, this.name)

  }
}

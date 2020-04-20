import { Component } from '@angular/core'

@Component({
  selector: 'example-component',
  template: `
[Начало example-компонента<br><ng-content></ng-content><br>Конец example-компонента<br><example2-component name="hello2">Контент, переданный в example2-компонент из example-компонента</example2-component>]
  `,
})
export class ExampleComponent {
  name: string;
  ngOnInit(){
    console.log(`ExampleComponent.OnInit name=`, this.name)
  }
}

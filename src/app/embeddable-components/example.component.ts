import { Component } from '@angular/core'

@Component({
  selector: 'example-component',
  template: `
[Начало example-компонента<br><ng-content></ng-content><br>Конец example-компонента]
  `,
})
export class ExampleComponent {
  name: string;
  ngOnInit(){
    console.log(`ExampleComponent.OnInit name=`, this.name)
  }
}

import { Component } from '@angular/core'

@Component({
  selector: 'example2-component',
  template: `
[Начало example2-компонента<br>Параметр, переданный в компонент: name={{name}}<br>Конец example2-компонента]
  `,
})
export class Example2Component {
  name: string;
  ngOnInit(){
    console.log(`Example2Component.OnInit name=`, this.name)
  }
}

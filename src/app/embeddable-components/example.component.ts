import { Component } from '@angular/core'

@Component({
  selector: 'example-component',
  template: `<br><br><br><br><br><br>
[Начало example-компонента
  <a routerLink="/"><span >Главная</span></a><a routerLink="about"><span >О нас</span></a><a routerLink="contacts"><span >Контакты</span></a><a routerLink="category/110"><span >Категория</span></a><a routerLink="product"><span >Товар</span></a><router-outlet></router-outlet> 
  <ng-content></ng-content><br> 

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

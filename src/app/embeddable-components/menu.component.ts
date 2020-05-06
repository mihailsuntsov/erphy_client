import { Component } from '@angular/core'

export interface menu{
  name: string;
  link: string;
}
@Component({
  selector: 'menu-component',
  template: `<br>
  <span *ngFor="let item of upperMenu">
    <a routerLink="{{item.link}}"><span >{{item.name}}</span></a>
  </span>
  `,
})


export class MenuComponent {
  name: string;
  upperMenu:menu[]=[
    {name:" Главная ", link:"/"},
    {name:" О нас ", link:"about"},
    {name:" Контакты ", link:"contacts"},
    {name:" Категория ", link:"category/110"},
    {name:" Товары ", link:"product"}
  ];


  insidecontent: string='';
  ngOnInit(){
 

    console.log(`MenuComponent.OnInit name=`, this.name)
  }
}

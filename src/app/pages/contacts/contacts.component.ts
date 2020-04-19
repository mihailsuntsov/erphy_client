import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  content:string;
  
  constructor() { }

  ngOnInit(): void {
    this.loadContent();
  }

  loadContent(){
    this.content = '<h1>\n  Загруженный контент HTML-страницы "О НАС", содержащей встроенные компоненты.\n</h1>\n<h2>А это сам встроенный компонент:</h2>\n<example-component name="hello">Контент, переданный в example-компонент.</example-component>\n<h2>А это второй встроенный компонент:</h2>\n<example2-component name="hello">Контент, переданный в example2-компонент.</example2-component>';
  }
  
}

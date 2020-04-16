import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  content = '<h1>\n  Загруженный контент HTML-страницы "О нас", содержащей встроенные компоненты.\n</h1>\n<h2>А это сам встроенный компонент:</h2>\n<example-component name="hello">Контент, переданный в example-компонент.</example-component>\n<h2>А это второй встроенный компонент:</h2>\n<example2-component name="hello">Контент, переданный в example2-компонент.</example2-component>';

  constructor() { }

  ngOnInit(): void {
  }

}

import { Component, OnInit } from '@angular/core';
import { WindowService } from '../../services/window.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  content:string;
  hostName: string;

  constructor(private windowService: WindowService) { }

  ngOnInit(): void {
    this.hostName = this.windowService.getHostname();
    this.loadContent();

  }

  loadContent(){
    this.content = '<h1>\n  Загруженный контент HTML-страницы "О НАС", содержащей встроенные компоненты.\n</h1>\n<h2>А это сам встроенный компонент:</h2>\n<example-component name="hello">Контент, переданный в example-компонент.</example-component>\n';
  }


}

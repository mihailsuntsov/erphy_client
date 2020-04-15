import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'dokiosite';
  // html:string = "Test dynamic component {{ 1 + 1 }}";

  content = '<h1>\n  I am content from the server, just normal HTML\n</h1>\n<my-component name="hello">I am the projected content!</my-component>';

}

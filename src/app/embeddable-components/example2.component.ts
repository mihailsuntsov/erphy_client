import { Component } from '@angular/core'

@Component({
  selector: 'example2-component',
  template: `<router-outlet></router-outlet>`,
})
export class Example2Component {
  name: string;
  insidecontent: string='';
  ngOnInit(){
    this.name='';

  }
}

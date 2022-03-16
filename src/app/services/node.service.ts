// import {Injectable} from '@angular/core';
// import { BehaviorSubject, Subject } from 'rxjs';

// @Injectable() 
// export class NodeService {
//   private node:Subject<Node> = new BehaviorSubject<Node>([]);

//   get node$(){
//     return this.node.asObservable().filter(node => !!node);
//   }

//   addNode(data:Node) {
//     this.node.next(data);
//   }
// }
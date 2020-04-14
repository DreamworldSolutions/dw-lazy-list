/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css } from 'lit-element';
import './list-row.js';
import '../dw-lazy-list';

class DwLazyListDemo extends LitElement {

  static get styles() {
    return [
      css`
        :host{
          display: block;
          height: 100%;
        }
      `
    ];
  }

  static get properties(){
    return {

      items: { type: Array }

    }
  }

  constructor(){
    super();
    this.items = new Array(150).fill({name: ''});

  }

  render() {
    return html`
      <dw-lazy-list nonContinuous>

        ${this.items.map(((item, index) => html`
          <list-row .index="${index}"></list-row>
        `))}

      </dw-lazy-list>
    `;
  }

  
}

window.customElements.define('dw-lazy-list-demo', DwLazyListDemo);
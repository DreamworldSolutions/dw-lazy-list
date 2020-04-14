/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement, html, css} from 'lit-element';

class ListRow extends LitElement {

  static get styles() {
    return [
      css`
        :host{
          display: block;
          font-size: 1rem;
          line-height: 1.5rem;
          font-weight: 400;
          letter-spacing: 0.03125em;
          color: rgba(0,0,0,0.87);
          padding: 24px;
          width: 500px;
          margin: 24px;
          min-height: 100px;
          box-shadow: 0px 3px 3px -2px rgba(0, 0, 0, 0.2),
                      0px 3px 4px 0px rgba(0, 0, 0, 0.14),
                      0px 1px 8px 0px rgba(0, 0, 0, 0.12);
        }

        .layout.vertical{
          display: flex;
          flex-direction: column;
        }

        .layout.horizontal{
          display: flex;
          flex-direction: row;
        }

        .right-align{
          width: 120px;
          text-align: right;
          color: rgba(0,0,0,0.54);
        }

        .title{
          margin-bottom: 8px;
          font-size: 1rem;
          line-height: 1.75rem;
          font-weight: bold;
          letter-spacing: 0.009375em;
        }

      `
    ];
  }

  static get properties(){
    return {

      active: { type: Boolean },

      active: { type: Number }

    }
  }

  constructor(){
    super();
    this.active = false;
  }

  shouldUpdate(){
    return this.active;
  }

  render() {
    console.log('Rendered row index:', this.index);

    return html`
      <section class="layout vertical container">
        <div class="title">Client Meeting ${this.index}</div>
        <div class="layout horizontal">
          <span class="right-align">Scheduled on:&nbsp;</span>
          <span class="value">Mar 19, 2020</span>
        </div>
      </section>
    `;
  }

}

window.customElements.define('list-row', ListRow);
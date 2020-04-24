/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { LitElement } from '@dw/pwa-helpers/lit-element';
import { html, css } from 'lit-element';

/* Lodash lib */
import debounce from 'lodash-es/debounce';
import forEach from 'lodash-es/forEach';

/**
 * This element is used to load list row's data lazily. Data can be load in continous or non-continious way.
 * 
 * At a time it works in one direction one. either Horizontal or Vertical. By default it works on `VERTICAL` direction
 * 
 * What is does?
 * 
 * This elements sets `active` property on the row element when it becomes visible in view-port area. Thus row element can load data when `active` becomes true.
 * The setting of the `active` property depends on the `nonContinuous`, `initialItemsCount` and `prerenderItemsPercentages` property.
 * 
 * How it works?
 * 
 *  - It selets all light element using `slot`
 *  - It listen on owned scroll event and window resize event to refresh list.
 *  - It marks `active` flag on light element which is available in visible viewport area.
 *  - It provides `refresh` method to refresh list. Integration element must use this method in following cases
 *    - New item is added to list
 *    - Remove existing item
 *    - Order is changed
 *    - Item height is changed.
 * 
 * Usage pattern:
 *    <lazy-list .direction="">
 *      <child-el></child-el>
 *      <child-el></child-el>
 *    </lazy-list>
 */
export class DwLazyList extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          position: relative;
          overflow: auto;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          height: 100%;
        }

        :host([hidden]){
          display: none;
        }

        :host([has-scroll]) {
          padding-right: var(--lazy-list-has-scroll-padding, 0px);
        }
      `
    ];
  }

  constructor() {
    super();
    this.direction = 'VERTICAL';
    /**
     * Increase this percentage criteria to mark more items are active which is reaches to visible area
     */
    this.prerenderItemsPercentages = 0.5;
    /**
     * Set initial render item count which always mark as `active` when item is attached
     */
    this.initialItemsCount = 10;

    this.nonContinuous = false;
    this.scrollTarget = this;

    /**
     * Debouncer for scroll to bottom.
     */
    this._scrollToBottomDebouncer = undefined;

    this.refresh = debounce(this.refresh.bind(this), 50);

  }

  static get properties() {
    return {
      /**
       * It is an input property
       * By default value is `VERTICAL`
       * 
       * Direction if lazy rendering list.
       */
      direction: { type: String, reflect: true, attribute: 'direction' },

      /**
       * It is input property.
       * By default value is `10`.
       * How many items to be rendered initially. These number of items will be rendered initially though they aren't
       *  matching any of the criteria: a. In view port area b. `prerenderItemsPercentage` c. `prerenderItemsCount`.
       */
      initialItemsCount: { type: Number },

      /**
       * It is input property.
       * How many extra items to be pre-rendered in percentage of viewport length (height/width).
       * It can be used with `prerenderItemsCount` as well. When both are specified, if item matching one of the
       *  criteria, it will be pre-rendered.
       * By default value is `0.5`
       */
      prerenderItemsPercentages: { type: Number },

      /**
       * It is input property.
       * How many extra items to be pre-rendered.
       * It can be used with `prerenderItemsCount` as well. When both are specified, if item matching one of the
       *  criteria, it will be pre-rendered.
       * By default value is `8`
       */
      prerenderItemsCount: { type: Number },

      /**
       * Input property
       * Set to true to set active of only visible rows. It also considers `prerenderItemsPercentages`
       * By default it's false
       */
      nonContinuous: { type: Boolean },

      /**
       * Input property
       * Specifies the element that will handle the scroll event on the behalf of the current element
       * This is typically a reference to an element
       */
      scrollTarget: { type: Object },

      /**
       * Output property and attribute.
       * It's set to `true` when it has scroll. `has-scroll` attribute can be used by user to set style accordingly.
       * e.g. In kerika it's used to update righ padding of the column. 
       */
      _hasScroll: { type: Boolean, reflect: true, attribute: 'has-scroll' },

      /**
       * When `_hasScroll=true`, and scroll position is at the top it's value will be `true`. Otherwise, it will be 
       * `false`.
       */
      _scrollTop: { type: Boolean, reflect: true, attribute: 'scroll-top' },

      /**
       * When `_hasScroll=true`, and scroll position is at the bottom it's value will be `true`. Otherwise, it will be 
       * `false`.
       */
      _scrollBottom: { type: Boolean, reflect: true, attribute: 'scroll-bottom' }
    };
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    let self = this;

    window.addEventListener('resize', self.refresh);
    self.scrollTarget.addEventListener('scroll', self.refresh);
  }

  disconnectedCallback() {
    let self = this;

    window.removeEventListener('resize', self.refresh);
    self.scrollTarget.removeEventListener('scroll', self.refresh);

    self._scrollToBottomDebouncer && self._scrollToBottomDebouncer.cancel();
    self._scrollToBottomDebouncer = undefined;

    super.disconnectedCallback();
  }

  firstUpdated() {
    super.firstUpdated && super.firstUpdated();

    this.updateComplete.then(()=> {
      this.initialItemRefresh();
    });
  }

  /**
   * Intial item refresh.
   * @public
   */
  initialItemRefresh() {
    let self = this;
    let viewportLength = self._findViewportLength();
    let scrollLength = self._findScorllLength();

    self._refreshScrollProps(viewportLength, scrollLength);

    forEach(self._findLazyChildren(), function (element, index) {
      if (element.active) {
        return true;
      }

      if (self.initialItemsCount && index < self.initialItemsCount) {
        element.active = true;
        return true;
      }

      return false;
    });
  }

  /**
   * Override `updateComplete` promise of lit-element.
   * `updateComplete` promise is resolved when all child element is renderd process is completed.
   * How to override `updateComplete` promise?
   *  - See this document (https://lit-element.polymer-project.org/guide/lifecycle#updatecomplete)
   * @override
   */
  async _getUpdateComplete() {
    await super._getUpdateComplete();

    let lazyChildren = Array.from(this._findLazyChildren() || []);

    lazyChildren = lazyChildren.filter((element)=> {return element.updateComplete});
    await Promise.all(lazyChildren.map((element)=>{return element.updateComplete}));;
  }

  /**
   * Refresh visible items.
   * @public
   */
  refresh() {
    let self = this;
    let viewportLength = self._findViewportLength();
    let scrollLength = self._findScorllLength();
    
    self._refreshScrollProps(viewportLength, scrollLength);
    let viewportBottom = scrollLength + viewportLength;
    let viewportTop = scrollLength - viewportLength;
    let viewportExtendedBottom = viewportBottom + viewportLength * (self.prerenderItemsPercentages || 0);
    let viewportExtendedTop = viewportTop - viewportLength * (self.prerenderItemsPercentages || 0);
    let lastVisibleElementInViewport = 0;

    forEach(this._findLazyChildren(), function (element, index) {
      if (element.active) {
        return true;
      }

      if (self.initialItemsCount && index < self.initialItemsCount) {
        element.active = true;
        return true;
      }

      let elStartPos = self.direction == 'VERTICAL' ? element.offsetTop : element.offsetLeft;

      if(self.nonContinuous){
        if(elStartPos < viewportExtendedBottom && (elStartPos > viewportTop || elStartPos > viewportExtendedTop)){
          element.active = true;
        }

        return true;
      }

      //element is in viewport area
      if (elStartPos < viewportBottom) {
        lastVisibleElementInViewport = index;
      }

      //element is in viewport or extended view-port or in range of prerenderItemscount
      if (elStartPos < viewportExtendedBottom || (index <= (lastVisibleElementInViewport + self.prerenderItemsCount))) {
        element.active = true;
        return true;
      }

      return false;
    });
  }

  /**
   * Set scroll to bottom.
   * When scroll has already bottom then do nothing.
   * After 2 second check scroll has bottom or not.
   *  - If scroll has bottom then do nothing.
   *  - Otherwise set again scroll to bottom.
   * @public
   */
  scrollToBottom() {
    let self = this;
    let scrollingElement = this._getScrollingElement();
     
    //If Already scroll has as bottom.
    if(scrollingElement.scrollTop + scrollingElement.clientHeight >= scrollingElement.scrollHeight) {
      return;
    }

    //Scroll to bottom.
    scrollingElement.scrollTop = scrollingElement.scrollHeight;

    //Cancel previous debouncer.
    self._scrollToBottomDebouncer && self._scrollToBottomDebouncer.cancel();

    //After 2 seconds check scroll still has bottom or not. If scroll has bottom then do nothing, Otherwise scroll set to bottom.
    self._scrollToBottomDebouncer = debounce(()=> {
      self.updateComplete.then(()=> {
        if(scrollingElement.scrollTop + scrollingElement.clientHeight >= scrollingElement.scrollHeight) {
          return;
        }
        self.scrollToBottom();
      });
    }, 2000);

    self._scrollToBottomDebouncer();
  }

  /**
   * @returns {Boolean} `true` when possible to scroll top, `false` otherwise.
   * @public
   */
  canScrollTop() {
    return this._findScorllLength() > 0;
  }

  /**
   * Scrolls at the given index item
   * @param {Number} index - move scroll to at which index 
   * @public
   */
  scrollToIndex(index){
    let rows = this._findLazyChildren() || [];
    let row = rows[index];

    if(row){
      let scrollingElement = this._getScrollingElement();
      
      scrollingElement.scrollTop = row.offsetTop;
    }
  }

  /**
  * Mange lazy list has scroll or not.
  * @protected
  */
  _refreshScrollProps(viewportLength, scrollLength) {
    let contentLength = this._findContentLength();
    
    this._hasScroll = contentLength > viewportLength;
    this._scrollTop = this._hasScroll && scrollLength == 0;
    this._scrollBottom = this._hasScroll && contentLength == viewportLength + scrollLength;
  }

  /**
   * Finds the height/width of the scrollable content based on the `direction`.
   */
  _findContentLength() {
    let scrollingElement = this._getScrollingElement();

    return this.direction == 'VERTICAL' ? scrollingElement.scrollHeight : scrollingElement.scrollWidth;
  }

  /**
   * Finds and returns scroll length. For `direction=VERTICAL` it returns `scrollTop` otherwise `scrollLeft`.
   * This can be overriden when this element is to be used for the custom scrolling behavior.
   * @protected
   */
  _findScorllLength() {
    let scrollingElement = this._getScrollingElement();

    return (this.direction == 'VERTICAL') ? scrollingElement.scrollTop : scrollingElement.scrollLeft;
  }

  /**
   * Finds and returns scroll length. For `direction=VERTICAL` it returns `offsetHeight` otherwise `offsetWidth`.
   * This can be overriden when this element is to be used for the custom scrolling behavior.
   * @protected
   */
  _findViewportLength() {
    if(this.scrollTarget === document){
      return (this.direction == 'VERTICAL') ? document.scrollingElement.clientHeight : document.scrollingElement.clientWidth;
    }

    return (this.direction == 'VERTICAL') ? this.scrollTarget.offsetHeight : this.scrollTarget.offsetWidth;
  }

  _getScrollingElement(){
    return this.scrollTarget === document ? this.scrollTarget.scrollingElement : this.scrollTarget;
  }

  /**
   * Finds elements from the <slot> which are to be lazy rendered.
   * This can be overriden when this element is to be used for the custom scrolling behavior.
   * @protected
   */
  _findLazyChildren() {
    return this.children;
  }

}

window.customElements.define('dw-lazy-list', DwLazyList);
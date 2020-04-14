
# dw-lazy-list

An element which is used to load list row's data lazily. Data can be load in `continuous` or `nonContinuous` way.

## Installation

```html
  npm install @dreamworld/dw-lazy-list
```

## Usage

```html
  @import '@dreamworld/dw-lazy-list/dw-lazy-list';
```

## [Demo](https://dreamworldsolutions.github.io/dw-lazy-list/demo/index.html)

## Features

- Sets `active` property on light dom when it becomes visible in the viewport
  - setting of the `active` property depends on the `nonContinuous`, `initialItemsCount`, `prerenderItemsCount` and `prerenderItemsPercentages` property.
- Can work in 2 direction. Horizontal and Vertical
- Set `prerenderItemsPercentages` or `prerenderItemsCount` to pre set `active` property on light dom before it's visible to viewport
  - `prerenderItemsCount` will not work for `nonContinuous` list


## How it works

- It selets all light element using `slot`
- It listen on owned `scroll` event and window `resize` event to refresh list.
- It marks `active` flag on light element which is available in visible viewport area.
- It provides `refresh` method to refresh list. Integration element must use this method in following cases:
  - New item is added to list
  - Existing item is removed
  - Order is changed
  - Item's height is changed.

## Methods

- refresh
- scrollToBottom
- canScrollTop
- canScrollBottom
- scrollToIndex

## Examples

```html
  <lazy-list initialItemsCount=20>
    <child-el></child-el>
    <child-el></child-el>
  </lazy-list>
```
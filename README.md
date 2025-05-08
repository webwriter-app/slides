# Slides (`@webwriter/slides@2.0.7`)
[License: MIT](LICENSE) | Version: 2.0.7

WIP - Present content as a sequence of screens (slides, tabs, etc.).

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Example | @webwriter/slides/snippets/example.html |



## `WebwriterSlides` (`<webwriter-slides>`)
Slideshow container for sequential display of content.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/slides/widgets/webwriter-slides.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/slides/widgets/webwriter-slides.js"></script>
<webwriter-slides></webwriter-slides>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/slides
```

```html
<link href="@webwriter/slides/widgets/webwriter-slides.css" rel="stylesheet">
<script type="module" src="@webwriter/slides/widgets/webwriter-slides.js"></script>
<webwriter-slides></webwriter-slides>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `activeSlideIndex` | `number` | Index of the active slide. | `0` | ✗ |
| `activeSlide` | `WebwriterSlide` | Active slide element. | - | ✗ |
| `hasNextSlide` | `boolean` | False if slideshow is on the last slide. | - | ✗ |
| `hasPreviousSlide` | `boolean` | False if slideshow is on the last slide. | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `addSlide` | Add a new empty slide element. | -
| `removeSlide` | Remove the currently active slide element. | -
| `nextSlide` | Activate the next slide element. | `backwards=false`, `step=1`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Slots
| Name | Description | Content Type |
| :--: | :---------: | :----------: |
| *(default)* | Content of the slideshow (should be slides only) | webwriter-slide+ |

*[Slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) define how the content of the widget is rendered.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `definingAsContext` | `true` |
| `definingForContent` | `true` |
| `content` | `webwriter-slide+` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public events, custom CSS properties, or CSS parts.*


## `WebwriterSlide` (`<webwriter-slide>`)
Single slide for the `webwriter-slides` widget.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/slides/widgets/webwriter-slide.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/slides/widgets/webwriter-slide.js"></script>
<webwriter-slide></webwriter-slide>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/slides
```

```html
<link href="@webwriter/slides/widgets/webwriter-slide.css" rel="stylesheet">
<script type="module" src="@webwriter/slides/widgets/webwriter-slide.js"></script>
<webwriter-slide></webwriter-slide>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `active` (`active`) | `boolean` | Whether the slide is selected/shown. | `false` | ✓ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Slots
| Name | Description | Content Type |
| :--: | :---------: | :----------: |
| *(default)* | Content of the slide | p \| flow* |

*[Slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) define how the content of the widget is rendered.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `definingAsContext` | `true` |
| `definingForContent` | `true` |
| `content` | `p \| flow*` |
| `uninsertable` | `true` |

*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public methods, events, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.4.0*
# Slides (`@webwriter/slides@2.3.0`)
[License: MIT](LICENSE) | Version: 2.3.0

Present content as a sequence of slides or tabs.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Example | @webwriter/slides/snippets/example.html |



## `WebwriterSlides` (`<webwriter-slides>`)
Container for displaying a slideshow of content sequentially.

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
| `activeSlideIndex` | `number` | Index of the currently active slide. | `0` | ✗ |
| `activeSlide` | `WebwriterSlide` | The active slide element based on the activeSlideIndex. | - | ✗ |
| `type` (`type`) | `'tabs' \| 'slides'` | Defines the type of view for the slideshow.
- "slides": Show content as sequential slides.
- "tabs": Show content using tabs. | `'slides'` | ✓ |
| `hasNextSlide` | `boolean` | False if slideshow is on the last slide. | - | ✗ |
| `hasPreviousSlide` | `boolean` | False if slideshow is on the first slide. | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `_handleKeyDown` | Handles keyboard navigation for the slideshow.
ArrowRight advances to the next slide, ArrowLeft goes back.
Only possible in preview mode. | `e: KeyboardEvent`
| `addSlide` | Add a new empty slide element. Optionally insert after given index. | `index: number`
| `duplicateSlide` | Duplicate an existing slide at given index. | `index: number`
| `removeActiveSlide` | Remove the currently active slide element. | -
| `removeSlide` | Remove the currently active slide element. | `slideIndex: number`
| `nextSlide` | Activate the next slide element. | `backwards=false`, `step=1`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Slots
| Name | Description | Content Type |
| :--: | :---------: | :----------: |
| `default` | Slide elements to be displayed (should be `webwriter-slide` components only). | webwriter-slide+ |

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
Represents a single slide in the `webwriter-slides` widget.

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
| `active` (`active`) | `boolean` | Indicates whether the slide is currently active/visible. | `false` | ✓ |
| `thumbnail` (`thumbnail`) | `string` | Data URI string for the slide thumbnail (e.g., "data:image/png;base64,..."). 
Used to display a preview image for the slide. | `""` | ✓ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Slots
| Name | Description | Content Type |
| :--: | :---------: | :----------: |
| `default` | The content displayed within the slide. | p \| flow* |

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
*Generated with @webwriter/build@1.5.0*
import "mocha/mocha.js";
import { assert } from "chai";
import {getMochaConfig} from "@webwriter/build/test"
import "../src/widgets/webwriter-slide";
import type { WebwriterSlides } from "../src/widgets/webwriter-slides";
import "../src/widgets/webwriter-slides";

mocha.setup(getMochaConfig())

describe("<webwriter-slides>", function () {

  before(async function () {
    document.body.insertAdjacentHTML("beforeend",
      `<webwriter-slides><webwriter-slide><p>Initial slide</p></webwriter-slide></webwriter-slides>`
    )
    const el = document.querySelector("webwriter-slides") as any
    await el.updateComplete
  }) 

  describe("initialize", function () {
    it("is defined", async function () {
      const el = document.querySelector("webwriter-slides:defined")
      assert.isNotNull(el)
    })
    it("contains defined <webwriter-slide>", async function () {
      const el = document.querySelector("webwriter-slide")
      assert.isNotNull(el)
    })
  })

  it("keeps controls and drawer labels in each slideshow's inherited language", async function () {
    const wrapper = document.createElement("section")
    wrapper.innerHTML = `
      <div lang="en"><webwriter-slides contenteditable="true"><webwriter-slide><p>First</p></webwriter-slide></webwriter-slides></div>
      <div lang="de"><webwriter-slides contenteditable="true"><webwriter-slide><p>Second</p></webwriter-slide></webwriter-slides></div>
    `
    document.body.append(wrapper)
    const [english, german] = Array.from(wrapper.querySelectorAll<WebwriterSlides>("webwriter-slides"))
    const view = (widget: WebwriterSlides) => widget.options.type.options.find((choice: {value: string}) => choice.value === "slides").label._
    const waitForView = async (widget: WebwriterSlides, label: string) => {
      for (let attempt = 0; attempt < 40 && view(widget) !== label; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      await widget.updateComplete
      assert.equal(view(widget), label)
    }
    try {
      await waitForView(german, "Folien")
      assert.equal(view(english), "Slides")
      const tooltips = (widget: WebwriterSlides) => Array.from(widget.shadowRoot.querySelectorAll("sl-tooltip"), tooltip => tooltip.getAttribute("content"))
      assert.include(tooltips(english), "Duplicate slide")
      assert.include(tooltips(german), "Folie duplizieren")
      assert.isFalse(german.hasAttribute("lang"))
      assert.isFalse(german.querySelector("webwriter-slide").hasAttribute("lang"))

      german.parentElement.lang = "en"
      await waitForView(german, "Slides")
      german.lang = "de"
      await waitForView(german, "Folien")
      german.removeAttribute("lang")
      await waitForView(german, "Slides")

      wrapper.firstElementChild.append(german)
      wrapper.firstElementChild.lang = "de"
      await waitForView(english, "Folien")
      await waitForView(german, "Folien")
      assert.isFalse(german.hasAttribute("lang"))
    } finally {
      wrapper.remove()
    }
  })
  
  describe("use methods", function () {
    it("can add a slide", async function () {
      const el = document.querySelector("webwriter-slides") as any
      el.addSlide()
      await el.updateComplete
      const slides = el.querySelectorAll("webwriter-slide")
      assert.equal(slides.length, 2)
    })
    it("removes the active slide and preserves the required last slide", async function () {
      const el = document.querySelector("webwriter-slides") as any
      el.removeActiveSlide()
      el.removeActiveSlide()
      const slides = el.querySelectorAll("webwriter-slide")
      assert.equal(slides.length, 1)
    })
  })
});

mocha.run()

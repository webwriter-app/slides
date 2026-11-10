import "mocha/mocha.js";
import { assert } from "chai";
import {getMochaConfig} from "@webwriter/build/test"
import "../src/widgets/webwriter-slide";
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
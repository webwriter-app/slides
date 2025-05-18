import "mocha/mocha.js";
import { assert } from "chai";
import {getMochaConfig} from "@webwriter/build/test"
import "../src/widgets/webwriter-slide";
import "../src/widgets/webwriter-slides";

mocha.setup(getMochaConfig())

describe("<webwriter-slides>", function () {

  before(function () {
    document.body.insertAdjacentHTML("beforeend",
      `<webwriter-slides></webwriter-slides>`
    )
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
      console.log(el.activeSlideIndex)
      const slides = el.querySelectorAll("webwriter-slide")
      assert.equal(slides.length, 2)
    })
    it("can remove a slide", async function () {
      const el = document.querySelector("webwriter-slides") as any
      el.removeSlide()
      const slides = el.querySelectorAll("webwriter-slide")
      assert.equal(slides.length, 1)
    })
  })
});

mocha.run()
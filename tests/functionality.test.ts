/// <reference types="mocha" />
import "mocha/mocha.js";
import { assert } from "chai";
import {getMochaConfig} from "@webwriter/build/test"
import "../src/widgets/webwriter-page";
import type { SelectOptionDeclaration } from "@webwriter/widget";
import { frame, mount, unmountAll, until } from "./helpers"
import type { WebwriterPages } from "../src/widgets/webwriter-pages";
import "../src/widgets/webwriter-pages";
import { captureThumbnail } from "../src/components/page-thumbnail";
import introductionSnippet from "../snippets/what-is-webwriter.html";

mocha.setup(getMochaConfig())

describe("<webwriter-pages>", function () {

  it("keeps all introduction images embedded and decodable after saving and reopening", async function () {
    try {
      const widget = await mount(introductionSnippet);
      const reopened = await mount(widget.outerHTML);
      for (const instance of [widget, reopened]) {
        const images = Array.from(instance.querySelectorAll("img"));
        assert.lengthOf(images, 4);
        for (const image of images) {
          assert.match(image.getAttribute("src")!, /^data:image\/png;base64,/, "embedded raster images survive snippet insertion");
          await image.decode();
          assert.equal(image.naturalWidth, 720);
          assert.equal(image.naturalHeight, 448);
          assert.isNotEmpty(image.alt);
        }
      }
    } finally { unmountAll(); }
  });

  before(async function () {
    document.body.insertAdjacentHTML("beforeend",
      `<webwriter-pages type="pages"><webwriter-page><p>Initial page</p></webwriter-page></webwriter-pages>`
    )
    const el = document.querySelector("webwriter-pages") as any
    await el.updateComplete
  }) 

  describe("initialize", function () {
    it("defaults to Tabs for newly created Pages widgets", async function () {
      const el = document.createElement("webwriter-pages") as WebwriterPages;
      el.innerHTML = "<webwriter-page><p>First page</p></webwriter-page>";
      document.body.append(el);
      try {
        await el.updateComplete;
        await until(() => el.shadowRoot!.querySelector(".page-tab"), "default tab");
        assert.equal(el.type, "tabs");
        assert.equal(el.orientation, "landscape");
        assert.isFalse(el.hasAttribute("orientation"), "default does not rewrite existing markup");
        assert.isFalse(el.hasAttribute("type"), "default view does not add an attribute");
        assert.isNull(el.shadowRoot!.querySelector(".page-thumb"));
        assert.equal(el.shadowRoot!.querySelector("button.page-select")!.getAttribute("aria-label"), "Page 1");
        assert.isUndefined(customElements.get("webwriter-slides"));
        assert.isUndefined(customElements.get("webwriter-slide"));
      } finally { el.remove(); }
    })

    it("restores Tabs when the View attribute is removed or cleared", async function () {
      const widget = await mount("<webwriter-pages type=\"pages\"><webwriter-page><p>Content</p></webwriter-page></webwriter-pages>");
      try {
        for(const value of [null, "", "unknown"]) {
          widget.setAttribute("type", "pages");
          await widget.updateComplete;
          if(value === null) widget.removeAttribute("type");
          else widget.setAttribute("type", value);
          await widget.updateComplete;
          assert.equal(widget.type, "tabs");
          assert.isNotNull(widget.shadowRoot!.querySelector(".page-tab"));
          assert.isNull(widget.shadowRoot!.querySelector(".page-thumb"));
        }
      } finally { unmountAll(); }
    })

    it("is defined", async function () {
      const el = document.querySelector("webwriter-pages:defined")
      assert.isNotNull(el)
    })
    it("contains defined <webwriter-page>", async function () {
      const el = document.querySelector("webwriter-page")
      assert.isNotNull(el)
    })
  })

  it("omits the Orientation option and captures existing page orientations without stretching", async function () {
    this.timeout(10000);
    const widget = await mount("<webwriter-pages><webwriter-page><p>Proportional preview</p></webwriter-page></webwriter-pages>");
    widget.parentElement!.style.width = "320px";
    try {
      assert.isUndefined(widget.options!.orientation);
      for(const orientation of ["landscape", "portrait"] as const) {
        widget.orientation = orientation;
        await widget.updateComplete;
        await frame(2);
        const image = new Image();
        image.src = await captureThumbnail(widget.querySelector("webwriter-page")!);
        await image.decode();
        assert.closeTo(image.naturalWidth / image.naturalHeight, orientation === "portrait" ? 9 / 16 : 16 / 9, 0.01, "capture preserves orientation");
      }
    } finally { unmountAll(); }
  })

  it("keeps controls and drawer labels in each Pages widget's inherited language", async function () {
    const wrapper = document.createElement("section")
    wrapper.innerHTML = `
      <div lang="en"><webwriter-pages type="pages" contenteditable="true"><webwriter-page><p>First</p></webwriter-page></webwriter-pages></div>
      <div lang="de"><webwriter-pages type="pages" contenteditable="true"><webwriter-page><p>Second</p></webwriter-page></webwriter-pages></div>
    `
    document.body.append(wrapper)
    const [english, german] = Array.from(wrapper.querySelectorAll<WebwriterPages>("webwriter-pages"))
    const view = (widget: WebwriterPages) => (widget.options!.type as SelectOptionDeclaration).options!.find((choice) => choice.value === "pages")!.label
    const waitForView = async (widget: WebwriterPages, label: string) => {
      for (let attempt = 0; attempt < 40 && view(widget) !== label; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      await widget.updateComplete
      assert.equal(view(widget), label)
    }
    try {
      await waitForView(german, "Folien")
      assert.equal(view(english), "Slides")
      assert.deepEqual(Object.keys(german.options!), ["type"], "View is the only setting");
      const labels = (widget: WebwriterPages) => Object.values(widget.actions).map(action => action.label)
      assert.deepEqual(labels(english), ["Add", "Remove", "Duplicate"])
      assert.deepEqual(labels(german), ["Hinzufügen", "Entfernen", "Duplizieren"])
      assert.deepEqual(Object.keys(english.optionGroups ?? {}), [], "options have no enclosing group")
      assert.isUndefined(english.options!.type.group, "View appears directly in the drawer")
      assert.isTrue(Object.values(english.actions).every(action => action.group === undefined), "page actions appear directly in the drawer")
      assert.isTrue(Object.values(english.actions).every(action => action.buttonGroup === "pages"), "page actions share one button group")
      assert.deepEqual(Object.values(english.actions).map(action => action.icon), ["Plus", "Delete", "Copy"], "all page actions have supported icons")
      const tooltips = (widget: WebwriterPages) => Array.from(widget.shadowRoot!.querySelectorAll("[title]"), control => control.getAttribute("title"))
      assert.include(tooltips(english), "Remove page")
      assert.include(tooltips(german), "Seite entfernen")
      assert.isFalse(german.hasAttribute("lang"))
      assert.isFalse(german.querySelector("webwriter-page")!.hasAttribute("lang"))

      german.parentElement!.lang = "en"
      await waitForView(german, "Slides")
      german.lang = "de"
      await waitForView(german, "Folien")
      german.removeAttribute("lang")
      await waitForView(german, "Slides")

      const first = wrapper.firstElementChild as HTMLElement
      first.append(german)
      first.lang = "de"
      await waitForView(english, "Folien")
      await waitForView(german, "Folien")
      assert.isFalse(german.hasAttribute("lang"))
    } finally {
      wrapper.remove()
    }
  })
  
  it("changes the drawer labels and tooltips with the inherited, explicit or removed language and announces it", async function () {
    const wrapper = document.createElement("section")
    wrapper.innerHTML = `
      <div lang="en"><webwriter-pages type="pages" contenteditable=""><webwriter-page><p>First</p></webwriter-page></webwriter-pages></div>
      <div lang="de"><webwriter-pages type="pages" contenteditable=""><webwriter-page><p>Second</p></webwriter-page></webwriter-pages></div>`
    document.body.append(wrapper)
    try {
      const [english, german] = Array.from(wrapper.querySelectorAll<WebwriterPages>("webwriter-pages"))
      const view = (widget: WebwriterPages) => (widget.options!.type as SelectOptionDeclaration).options!.find((choice) => choice.value === "pages")!.label
      const until = async (condition: () => boolean, message: string) => {
        for (let attempt = 0; attempt < 200 && !condition(); attempt++) await new Promise(resolve => setTimeout(resolve, 30))
        assert.isTrue(condition(), message)
      }
      const tooltips = (widget: WebwriterPages) => Array.from(widget.shadowRoot!.querySelectorAll("[title]"), control => control.getAttribute("title"))
      await until(() => view(german) === "Folien", "German drawer label")
      assert.equal(view(english), "Slides")
      assert.include(tooltips(english), "Remove page")
      await until(() => tooltips(german).includes("Seite entfernen"), "German tooltip")
      let changes = 0
      german.addEventListener("optionschange", () => changes++)
      german.parentElement!.lang = "en"
      await until(() => view(german) === "Slides", "back to English")
      german.lang = "de"
      await until(() => view(german) === "Folien", "explicit lang")
      german.removeAttribute("lang")
      await until(() => view(german) === "Slides", "lang removed")
      assert.isAbove(changes, 0, "optionschange sent")
    } finally {
      wrapper.remove()
    }
  })

  describe("conversions and signals", function () {
    const make = async (html: string) => {
      const wrapper = document.createElement("div")
      wrapper.innerHTML = html
      document.body.append(wrapper)
      const el = wrapper.querySelector("webwriter-pages") as any
      await el.updateComplete
      return { wrapper, el }
    }

    it("imports sections and exports Details elements", function () {
      const Widget = customElements.get("webwriter-pages") as any
      assert.deepEqual(Object.keys(Widget.convertFrom), ["section"])
      assert.deepEqual(Widget.convertTo, {details: "toDetails"})
    })

    it("turns each page into a detached Details element with a plaintext summary", async function () {
      const { wrapper, el } = await make(`<webwriter-pages type="pages"><webwriter-page label="Introduction"><h2>A</h2><!--keep--><p lang="la">One</p><svg xmlns="http://www.w3.org/2000/svg"><circle r="2"></circle></svg></webwriter-page><webwriter-page><p>Two</p></webwriter-page><webwriter-page label="&lt;b&gt;Literal&lt;/b&gt;"><p>Three</p></webwriter-page></webwriter-pages>`)
      try {
        const original = el.innerHTML
        const fragment = el.toDetails() as DocumentFragment
        const disclosures = Array.from(fragment.children)
        assert.deepEqual(disclosures.map(s => s.localName), ["details", "details", "details"])
        assert.deepEqual(disclosures.map(s => s.firstElementChild!.textContent), ["Introduction", "Page 2", "<b>Literal</b>"])
        assert.isTrue(disclosures.every(s => s.firstElementChild!.localName === "summary"))
        assert.equal(disclosures[2].firstElementChild!.childElementCount, 0, "label is plaintext")
        assert.equal(disclosures[0].innerHTML, '<summary>Introduction</summary>' + el.children[0].innerHTML)
        assert.equal(disclosures[0].querySelector("circle")!.namespaceURI, "http://www.w3.org/2000/svg")
        assert.isFalse(disclosures[0].hasAttribute("name"), "disclosures remain independent")
        assert.isFalse(disclosures[0].isConnected, "result is detached")
        assert.equal(el.innerHTML, original, "conversion leaves source content intact")
        disclosures[0].querySelector("p")!.textContent = "Changed copy"
        assert.equal(el.children[0].querySelector("p")!.textContent, "One", "contents are cloned")
      } finally { wrapper.remove() }
    })

    it("converts a single empty page and declines an empty widget", async function () {
      const { wrapper, el } = await make("<webwriter-pages><webwriter-page></webwriter-page></webwriter-pages>")
      try {
        const fragment = el.toDetails() as DocumentFragment
        assert.equal(fragment.childElementCount, 1)
        assert.equal(fragment.firstElementChild!.outerHTML, "<details><summary>Page 1</summary></details>")
        el.replaceChildren()
        assert.isNull(el.toDetails())
      } finally { wrapper.remove() }
    })

    it("still imports nested sections and their labels", async function () {
      const { wrapper, el } = await make("<webwriter-pages><webwriter-page><p>Old</p></webwriter-page></webwriter-pages>")
      try {
        const source = document.createDocumentFragment()
        const section = document.createElement("section")
        section.innerHTML = '<section aria-label="Introduction"><h2>A</h2><p>One</p></section><section><p>Two</p></section>'
        source.append(section)
        assert.isTrue(el.loadSections(source))
        assert.equal(el.children.length, 2)
        assert.equal(el.children[0].getAttribute("label"), "Introduction")
        assert.deepEqual(Array.from(el.children, (page: any) => page.innerHTML), ["<h2>A</h2><p>One</p>", "<p>Two</p>"])
      } finally { wrapper.remove() }
    })

    it("takes a single section as one page and declines other input", async function () {
      const { wrapper, el } = await make(`<webwriter-pages type="pages"><webwriter-page><p>Old</p></webwriter-page></webwriter-pages>`)
      try {
        const bad = document.createDocumentFragment()
        bad.append(document.createElement("div"))
        assert.isFalse(el.loadSections(bad))
        assert.equal(el.querySelectorAll("webwriter-page").length, 1)
        const good = document.createDocumentFragment()
        const section = document.createElement("section")
        section.innerHTML = "<p>Only</p>"
        good.append(section)
        assert.isTrue(el.loadSections(good))
        assert.equal(el.querySelector("webwriter-page").innerHTML, "<p>Only</p>")
      } finally { wrapper.remove() }
    })

    it("publishes the current page and the count as stable signals", async function () {
      const { wrapper, el } = await make(`<webwriter-pages type="pages"><webwriter-page><p>A</p></webwriter-page><webwriter-page><p>B</p></webwriter-page></webwriter-pages>`)
      try {
        const signals = el.signals
        assert.strictEqual(el.signals, signals)
        await until(() => signals.count.get() === 2, "count")
        assert.equal(signals.page.get(), 1)
        el.nextPage()
        await el.updateComplete
        assert.equal(signals.page.get(), 2)
      } finally { wrapper.remove() }
    })
  })

  describe("use methods", function () {
    it("can add a page", async function () {
      const el = document.querySelector("webwriter-pages") as any
      el.addPage()
      await el.updateComplete
      const pages = el.querySelectorAll("webwriter-page")
      assert.equal(pages.length, 2)
    })
    it("removes the active page and preserves the required last page", async function () {
      const el = document.querySelector("webwriter-pages") as any
      el.removeActivePage()
      el.removeActivePage()
      const pages = el.querySelectorAll("webwriter-page")
      assert.equal(pages.length, 1)
    })
  })
});

mocha.run()

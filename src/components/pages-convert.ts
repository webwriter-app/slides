/** A detached disclosure with a copy of the page content; the page stays as it is. */
export function pageToDetails(page: Element, doc: Document, fallbackLabel: string): HTMLDetailsElement {
    const details = doc.createElement("details");
    const summary = doc.createElement("summary");
    const label = page.getAttribute("label");
    summary.textContent = label?.trim() ? label : fallbackLabel;
    details.append(summary);
    for (const child of Array.from(page.childNodes)) details.append(child.cloneNode(true));
    return details;
}

/**
 * The pages a `section` stands for: its nested `section` children when it has any
 * (one page each), otherwise the section itself.
 */
export function sectionToPages(source: Element, doc: Document): HTMLElement[] {
    const nested = Array.from(source.children).filter((child) => child.localName === "section");
    const parts = nested.length ? nested : [source];
    return parts.map((part) => {
        const page = doc.createElement("webwriter-page");
        const label = part.getAttribute("aria-label");
        if (label) page.setAttribute("label", label);
        for (const child of Array.from(part.childNodes)) page.append(child.cloneNode(true));
        if (!page.querySelector("*") && !page.textContent?.trim()) page.replaceChildren(doc.createElement("p"));
        return page;
    });
}

/** Draws a small WebP preview of a page; the capture library is loaded when the first one is needed. */
export async function captureThumbnail(page: Element): Promise<string> {
    const { snapdom } = await import("@zumer/snapdom");
    const result = await snapdom(page, { width: 240, dpr: 1 });
    const img = await result.toWebp({ quality: 0.8 });
    return img.src;
}

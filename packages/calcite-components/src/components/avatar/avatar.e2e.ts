import { newE2EPage } from "@stencil/core/testing";
import { accessible, defaults, hidden, renders } from "../../tests/commonTests";
import { placeholderImage } from "../../../.storybook/placeholder-image";
import { html } from "../../../support/formatting";
import { CSS } from "./resources";

const placeholderUrl = placeholderImage({
  width: 120,
  height: 120,
});

describe("calcite-avatar", () => {
  describe("renders", () => {
    renders("calcite-avatar", { display: "inline-block" });
  });

  describe("honors hidden attribute", () => {
    hidden("calcite-avatar");
  });

  describe("accessible", () => {
    accessible("calcite-avatar");
    accessible(`<calcite-avatar thumbnail="${placeholderUrl}"></calcite-avatar>`);
  });

  describe("defaults", () => {
    defaults("calcite-avatar", [
      {
        propertyName: "scale",
        defaultValue: "m",
      },
    ]);
  });

  it("renders thumbnail when provided", async () => {
    const page = await newE2EPage();
    await page.setContent(`<calcite-avatar thumbnail="${placeholderUrl}"></calcite-avatar>`);
    const thumbnail = await page.find("calcite-avatar >>> .thumbnail");
    expect(thumbnail).toEqualAttribute("src", placeholderUrl);
  });

  it("renders initials when no thumbnail is provided", async () => {
    const page = await newE2EPage();
    await page.setContent("<calcite-avatar full-name='My Dude'></calcite-avatar>");
    const initials = await page.find("calcite-avatar >>> .initials");
    expect(initials).toEqualText("MD");
  });

  it("computes a background fill color based on user id", async () => {
    const page = await newE2EPage();
    await page.setContent("<calcite-avatar user-id='25684463a00c449585dbb32a065f6b74'></calcite-avatar>");
    const style = await page.evaluate(() => {
      const background = document.querySelector("calcite-avatar").shadowRoot.querySelector(".background");
      return background.getAttribute("style");
    });
    expect(style).toEqual("background-color: rgb(214, 232, 245);");
  });

  it("computes a background fill if id is not a valid hex", async () => {
    const page = await newE2EPage();
    await page.setContent("<calcite-avatar user-id='for sure not a hex' username='THaverford'></calcite-avatar>");
    const initials = await page.find("calcite-avatar >>> .initials");
    expect(initials).toEqualText("TH");
    const style = await page.evaluate(() => {
      const background = document.querySelector("calcite-avatar").shadowRoot.querySelector(".background");
      return background.getAttribute("style");
    });
    expect(style).toEqual("background-color: rgb(245, 214, 236);");
  });

  it("renders default icon when no information is passed", async () => {
    const page = await newE2EPage();
    await page.setContent("<calcite-avatar></calcite-avatar>");
    const icon = await page.find("calcite-avatar >>> .icon");
    const visible = await icon.isVisible();
    expect(visible).toBe(true);
  });

  it("generates unique background if names are similar", async () => {
    const page = await newE2EPage();
    await page.setContent(html`
      <calcite-avatar full-name="John Doe" username="john_doe"></calcite-avatar>
      <calcite-avatar full-name="John Doe 1" username="john_doe1"></calcite-avatar>
      <calcite-avatar full-name="John Doe 2" username="john_doe2"></calcite-avatar>
    `);

    const avatars = [
      await page.find(`calcite-avatar:nth-child(1) >>> .${CSS.background}`),
      await page.find(`calcite-avatar:nth-child(2) >>> .${CSS.background}`),
      await page.find(`calcite-avatar:nth-child(3) >>> .${CSS.background}`),
    ];

    const [firstBgColor, secondBgColor, thirdBgColor] = await Promise.all(
      avatars.map((avatar) => avatar.getComputedStyle().then(({ backgroundColor }) => backgroundColor)),
    );

    expect(firstBgColor).not.toEqual(secondBgColor);
    expect(secondBgColor).not.toEqual(thirdBgColor);
    expect(firstBgColor).not.toEqual(thirdBgColor);
  });
});

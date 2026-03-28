import { test, expect } from "@playwright/test";

const QUESTIONS = `1. What is the patient's primary diagnosis and ICD-10 code?
2. Has the patient failed Restasis? If so, provide dates and reason.
3. Will this medication be used with any other prescription dry eye medication?`;

test.describe("New PA — Paste Questions", () => {
  test("tab shows textarea and accepts three test questions", async ({
    page,
  }) => {
    await page.goto("/new-pa");

    await page.getByRole("tab", { name: "Paste Questions" }).click();

    const textarea = page.getByPlaceholder(/Paste payer questions/i);
    await expect(textarea).toBeVisible();

    await textarea.fill(QUESTIONS);
    await expect(textarea).toHaveValue(QUESTIONS);

    const lines = (await textarea.inputValue())
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(3);
  });
});

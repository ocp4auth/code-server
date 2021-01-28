import { chromium, Page, Browser, BrowserContext } from "playwright"

// NOTE: this is hard-coded and passed as an environment variable
// See the test job in ci.yml
const PASSWORD = "e45432jklfdsab"

describe("login", () => {
  let browser: Browser
  let page: Page
  let context: BrowserContext

  beforeAll(async () => {
    browser = await chromium.launch()
    context = await browser.newContext()
  })

  afterAll(async () => {
    await browser.close()
    await context.close()
  })

  beforeEach(async () => {
    page = await context.newPage()
  })

  afterEach(async () => {
    await page.close()
    // Remove password from local storage
    await context.clearCookies()
  })

  it("should see a 'Go Home' button in the Application Menu that goes to coder.com", async () => {
    await page.goto("http://localhost:8080")
    // In case the page takes a long time to load
    await page.waitForTimeout(2000)
    // Type in password
    await page.fill(".password", PASSWORD)
    // Click the submit button and login
    await page.click(".submit")
    // Click the Applicaiton menu
    await page.click(".menubar-menu-button[title='Application Menu']")
    // See the Go Home button
    const goHomeButton = "a.action-menu-item span[aria-label='Go Home']"
    expect(await page.isVisible(goHomeButton))
    // Click it and navigate to coder.com
    await page.click(goHomeButton)

    // If there are unsaved changes it will show a dialog
    // asking if you're sure you want to leave
    page.on("dialog", (dialog) => dialog.accept())

    await page.waitForTimeout(5000)
    expect(await page.url()).toBe("https://coder.com/")
  })
})

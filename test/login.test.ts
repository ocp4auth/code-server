import { chromium, Page, Browser, BrowserContext } from "playwright"

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
  })

  beforeEach(async () => {
    page = await context.newPage()
  })

  afterEach(async () => {
    await page.close()
    await context.clearCookies()
  })

  it("should see the login page", async () => {
    await page.goto("http://localhost:8080")
    // It should send us to the login page
    expect(await page.title()).toBe("code-server login")
  })

  it("should be able to login with the password from config.yml", async () => {
    await page.goto("http://localhost:8080")
    // Get password
    const password = "helloworld"
    // Type in password
    await page.fill(".password", password)
    // Click the submit button and login
    await page.click(".submit")
    // See the editor
    const codeServerEditor = await page.isVisible(".monaco-workbench")
    expect(codeServerEditor).toBeTruthy()
    // Remove password from local storage
  })
})

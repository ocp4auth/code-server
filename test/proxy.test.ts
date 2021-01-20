import * as assert from "assert"
import * as express from "express"
import * as httpserver from "./httpserver"
import * as integration from "./integration"
import bodyParser from "body-parser"

describe("proxy", () => {
  const nhooyrDevServer = new httpserver.HttpServer()
  let codeServer: httpserver.HttpServer | undefined
  let proxyPath: string
  let e: express.Express

  before(async () => {
    await nhooyrDevServer.listen((req, res) => {
      e(req, res)
    })
    proxyPath = `/proxy/${nhooyrDevServer.port()}/wsup`
  })

  after(async () => {
    await nhooyrDevServer.close()
  })

  beforeEach(() => {
    e = express.default()
  })

  afterEach(async () => {
    if (codeServer) {
      await codeServer.close()
      codeServer = undefined
    }
  })

  it("should rewrite the base path", async () => {
    e.get("/wsup", (req, res) => {
      res.json("asher is the best")
    })
    ;[, , codeServer] = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath)
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "asher is the best")
  })

  it("should not rewrite the base path", async () => {
    e.get(proxyPath, (req, res) => {
      res.json("joe is the best")
    })
    ;[, , codeServer] = await integration.setup(["--auth=none", "--proxy-path-passthrough=true"], "")
    const resp = await codeServer.fetch(proxyPath)
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "joe is the best")
  })

  it("should rewrite redirects", async () => {
    e.post("/wsup", (req, res) => {
      res.redirect(307, "/finale")
    })
    e.post("/finale", (req, res) => {
      res.json("redirect success")
    })
    ;[, , codeServer] = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "POST",
    })
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "redirect success")
  })

  it("should not rewrite redirects", async () => {
    const finalePath = proxyPath.replace("/wsup", "/finale")
    e.post(proxyPath, (req, res) => {
      res.redirect(307, finalePath)
    })
    e.post(finalePath, (req, res) => {
      res.json("redirect success")
    })
    ;[, , codeServer] = await integration.setup(["--auth=none", "--proxy-path-passthrough=true"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "POST",
    })
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "redirect success")
  })

  it("should allow post bodies", async () => {
    e.use(bodyParser.json({ strict: false }))
    e.post("/wsup", (req, res) => {
      res.json(req.body)
    })
    ;[, , codeServer] = await integration.setup(["--auth=none"], "")
    const resp = await codeServer.fetch(proxyPath, {
      method: "post",
      body: JSON.stringify("coder is the best"),
      headers: {
        "Content-Type": "application/json",
      },
    })
    assert.equal(resp.status, 200)
    assert.equal(await resp.json(), "coder is the best")
  })
})

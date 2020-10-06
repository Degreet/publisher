require('c4console')
const { MongoClient, ObjectId } = require("mongodb")
const { createServer } = require('http')
const fs = require('fs'), fsp = fs.promises
const bcrypt = require('bcrypt')
const Cookies = require('cookies')
const dotenv = require('dotenv')
dotenv.config()

const dbName = "publisher"
const appName = "Publisher"

const PORT = process.env.PORT || 3000
const pass = process.env.KEY
const server = createServer(requestHandler)
const uri = `mongodb+srv://Node:${pass}@cluster0-ttfss.mongodb.net/${dbName}?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

async function requestHandler(req, resp) {
  let { url } = req
  const cookies = new Cookies(req, resp)
  resp.setHeader('Content-Type', 'text/html')

  if (url.startsWith('/api/')) {
    url = url.slice(5)

    if (url == "check-project-name") {
      const { projectName } = JSON.parse(await streamToString(req))
      const article = await getArticle(projectName)
      const data = {}

      data.checked = article ? false : true
      resp.end(JSON.stringify(data))
    } else if (url == "add") {
      const article = JSON.parse(await streamToString(req))
      const checkArticle = await getArticle(article.projectName)
      const data = {}

      if (checkArticle) {
        data.success = false
        data.msg = `Такое имя проекта уже занято. Попробуйте другое.`
      } else {
        await articles.insertOne({
          projectName: article.projectName,
          html: article.html,
          css: article.css,
          js: article.js
        })

        data.url = `${PORT == 3000 ? "http://localhost:3000" : "https://publisher-js.herokuapp.com"}/project/${article.projectName}`
        data.success = true
      }

      resp.end(JSON.stringify(data))
    }
  } else if (url.startsWith("/project/")) {
    const projectName = url.replace("/project/", "")
    const article = await getArticle(projectName)

    if (article) {
      resp.end(/*html*/`
        <style>${article.css}</style>
        ${article.html}
        <script>${article.js}</script>
      `)
    } else {
      resp.end(await getPage(`${appName} - Ошибка №404`, buildPath("errors/404.html")))
    }
  } else {
    let path = process.cwd() + '/public' + url.replace(/\/$/, '')

    try {
      const target = await fsp.stat(path).catch(_ => fsp.stat(path += '.html'))
      if (target.isDirectory()) path += '/index.html'
      const match = path.match(/\.(\w+)$/), ext = match ? match[1] : 'html'

      if (path.endsWith("/public/index.html")) {
        resp.end(await getPage(`${appName} - Главная`, buildPath("index.html")))
      } else {
        fs.createReadStream(path).pipe(resp)
        resp.setHeader('Content-Type', {
          html: 'text/html',
          json: 'application/json',
          css: 'text/css',
          ico: 'image/x-icon',
          jpg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          svg: 'image/svg+xml',
          js: 'application/javascript',
        }[ext])
      }
    } catch {
      resp.end(await getPage(`${appName} - Ошибка №404`, buildPath("errors/404.html")))
    }
  }
}

async function getPage(title, path, script) {
  const [file, body] = await Promise.all([fsp.readFile(path),
  fsp.readFile(buildPath("templates/main.html"))])
  const html = body.toString()
    .replace("PAGE_TITLE", title)
    .replace("PAGE_BODY", file.toString())
    .replace("PAGE_SCRIPT", script ? /*html*/`<script src="/js/${script}.js"></script>` : "")
  return html
}

function buildPath(path) {
  return `${__dirname}/public/${path}`
}

async function getArticle(projectName) {
  return await articles.findOne({ projectName })
}

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

client.connect(err => {
  if (err) console.log(err)

  global.articles = client.db(dbName).collection("articles")

  server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))
  setTimeout(() => client.close(), 1e9)
})
const fs = require('fs')
const path = require('path')
const remark = require('remark')
const html = require('remark-html')
const frontmatter = require('remark-frontmatter')
const parse = require('remark-parse')
const unified = require('unified')
const yaml = require('js-yaml')
const subSuper = require('remark-sub-super')
const slugs = require('remark-slug')
const headings = require('remark-autolink-headings')
const toc = require('remark-toc')

const marginalia = require('./syntax/marginalia')
const reflink = require('./syntax/reflink')
const includes = require('./syntax/includes')

function logger () {
  return function (data) {
    console.log(JSON.stringify(data))
  }
}

var docTitle = null
var docType = null

function parseMetadata () {
  return function (data) {
    var type = data.children[0].type
    if (type !== 'yaml') return

    var content = yaml.load(data.children[0].value)

    docType = content.type
    docTitle = content.title

    data.children.splice(1, 0, {
      type: 'html',
      value: `<div class="document-title">${docTitle}</div>`
    })
  }
}


function parseLexdown (contents, opts, cb) {
  contents = includes(contents)
  remark()
    .use(parse, { footnotes: true })
    .use(toc, {
      heading: 'Inhaltsverzeichnis'
    })
    .use(marginalia)
    .use(reflink)
    .use(parseMetadata)
    // .use(logger)
    .use(frontmatter, ['yaml'])
    .use(subSuper)
    .use(slugs)
    .use(headings)
    .use(html)
    .process(contents, (err, file) => {
      var basicCSS = fs.readFileSync(path.join(__dirname, 'assets/css/basic.css'), {
        encoding: 'utf8'
      })
      var specificCSS = fs.readFileSync(path.join(__dirname, 'assets/css/', `${docType}.css`), {
        encoding: 'utf8'
      })
      var html = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            ${basicCSS}
            ${specificCSS}
          </style>
        </head>
        <body>
          ${file.contents}
        </body>
        </html>
      `

      cb(err, html)
    })
}

module.exports = parseLexdown

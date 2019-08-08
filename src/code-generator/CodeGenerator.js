import domEvents from './dom-events-to-record'
import pptrActions from './pptr-actions'
import Block from './Block'

const importPuppeteer = `const puppeteer = require('puppeteer');\n`

const header = `const browser = await puppeteer.launch(PUPPETEER_OPTS)
const page = await browser.newPage()`

const footer = `await browser.close()`

const wrappedHeader = `(async () => {
  const browser = await puppeteer.launch(PUPPETEER_OPTS)
  const page = await browser.newPage()\n`

const wrappedFooter = `  await browser.close()
})()`

const varData="${varData}"
const selector="${selector}"
const frame="${frame}"

export const defaults = {
  wrapAsync: true,
  headless: true,
  waitForNavigation: true,
  waitForSelectorOnClick: true,
  blankLinesBetweenBlocks: true,
  dataAttribute: '',
  // code: {
  clickCode: 'await ${frame}.click("${selector}");',
  waitClickCode: 'await ${frame}.waitForSelector("${selector}");\n await ${frame}.click("${selector}");',
  keyDownCode: 'await ${frame}.type("${selector}", "${value}")',
  changeCode: 'await ${frame}.select("${selector}", "${value}")',
  goToCode: 'await ${frame}.goto("${href}")',
  viewportCode: 'await ${frame}.setViewport({ width: ${width}, height: ${height} })',
  readDataCode: 
    `globalVar.${varData}=await ${frame}.evaluate(element => {
      let obj= document.querySelector("${selector}");
      if(obj.options) return obj.options[obj.selectedIndex].innerHTML
      if(obj.value) return obj.value
      return obj.innerHTML
      });`,
  readDinamicDataCode: 'readDinamicDataCode',
  readWaitDataCode: 
  `await ${frame}.waitForSelector("${selector}")
  globalVar.${varData}=await ${frame}.evaluate(element => {
    let obj= document.querySelector("${selector}");
    if(obj.options) return obj.options[obj.selectedIndex].innerHTML
    if(obj.value) return obj.value
    return obj.innerHTML
    });`,
  readWaitDinamicDataCode: `await ${frame}.waitForSelector("${selector}")
  globalVar.${varData}=await ${frame}.evaluate(element => { 
    let observer = new MutationObserver(
    function() {
      let obj= document.querySelector("${selector}");
      if(obj.options) return obj.options[obj.selectedIndex].innerHTML
      if(obj.value) return obj.value
      return obj.innerHTML
     }
    )
    let config = {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    }
    let obj= document.querySelector("${selector}");
    observer.observe(obj, config)
  });`

  // }
}

export default class CodeGenerator {
  constructor(options) {
    this._options = Object.assign(defaults, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}

    this._hasNavigation = false
  }

  static get userOptions() {
    // If `_foo` is inherited or doesn't exist yet, treat it as `undefined`
    return this.hasOwnProperty('_userOptions') ? this._userOptions : void 0
  }
  static set userOptions(v) { this._userOptions = v }

  generate(events) {
    return importPuppeteer + this._getHeader() + this._parseEvents(events) + this._getFooter()
  }

  _getHeader() {
    console.debug(this._options)
    let hdr = this._options.wrapAsync ? wrappedHeader : header
    hdr = this._options.headless ? hdr : hdr.replace('launch()', 'launch({ headless: false })')
    return hdr
  }

  _getFooter() {
    return this._options.wrapAsync ? wrappedFooter : footer
  }

  _parseEvents(events) {
    let result = ''

    for (let i = 0; i < events.length; i++) {

      const { action,
        selector,
        value,
        href,
        keyCode,
        tagName,
        frameId,
        frameUrl,
        dinamicData, // Indica si el dato a capturar es dinamico
        varData // Nombre de la variable donde se guardará el dato
       } = events[i]

      // we need to keep a handle on what frames events originate from
      this._setFrames(frameId, frameUrl)

      switch (action) {
        case 'keydown':
          // if (keyCode === 9) { // tab key
          //   this._blocks.push(this._handleKeyDown(selector, value, keyCode))
          // }
          if (keyCode !== 113) { // F2
            this._blocks.push(this._handleKeyDown(selector, value, keyCode))
          } else {
            this._blocks.push(this._handleReadData(selector, dinamicData, varData))
          }
          break
        case 'click':
          this._blocks.push(this._handleClick(selector, dinamicData, events))
          break
        case 'change':
          if (tagName === 'SELECT') {
            this._blocks.push(this._handleChange(selector, value))
          }
          break
        case 'goto*':
          this._blocks.push(this._handleGoto(href, frameId))
          break
        case 'viewport*':
          this._blocks.push((this._handleViewport(value.width, value.height)))
          break
        case 'navigation*':
          this._blocks.push(this._handleWaitForNavigation())
          this._hasNavigation = true
          break
      }
    }

    if (this._hasNavigation && this._options.waitForNavigation) {
      console.debug('Adding navigationPromise declaration')
      const block = new Block(this._frameId, { type: pptrActions.NAVIGATION_PROMISE, value: 'const navigationPromise = page.waitForNavigation()' })
      this._blocks.unshift(block)
    }

    console.debug('post processing blocks:', this._blocks)
    this._postProcess()

    const indent = this._options.wrapAsync ? '  ' : ''
    const newLine = `\n`

    for (let block of this._blocks) {
      const lines = block.getLines()
      for (let line of lines) {
        result += indent + line.value + newLine
      }
    }

    return result
  }

  _setFrames(frameId, frameUrl) {
    if (frameId && frameId !== 0) {
      this._frameId = frameId
      this._frame = `frame_${frameId}`
      this._allFrames[frameId] = frameUrl
    } else {
      this._frameId = 0
      this._frame = 'page'
    }
  }

  _postProcess() {
    // when events are recorded from different frames, we want to add a frame setter near the code that uses that frame
    if (Object.keys(this._allFrames).length > 0) {
      this._postProcessSetFrames()
    }

    if (this._options.blankLinesBetweenBlocks && this._blocks.length > 0) {
      this._postProcessAddBlankLines()
    }
  }

  _handleKeyDown(selector, value) {
    //value es la cadena obtenida del input pero solo nos interesa la ultima tecla pulsada
    if(value.length>0)
      value=value.substring(value.length-1);
    const block = new Block(this._frameId)
    let code = this._options.keyDownCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${value}/g, value)
    block.addLine({ type: domEvents.KEYDOWN, value: code })
    return block
  }

  _handleClick(selector, dinamicData, events) {
    const block = new Block(this._frameId)
    let code = ''
    if (this._options.waitForSelectorOnClick) {
      code = this._options.waitClickCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector)
    } else {
      code = this._options.clickCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector)
    }
    block.addLine({ type: domEvents.CLICK, value: code })
    return block
  }
  _handleChange(selector, value) {
    let code = this._options.changeCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${value}/g, value)
    return new Block(this._frameId, { type: domEvents.CHANGE, value: code })
  }
  _handleGoto(href) {
    let code = this._options.goToCode.replace(/\${frame}/g, this._frame).replace(/\${href}/g, href)
    return new Block(this._frameId, { type: pptrActions.GOTO, value: code })
  }

  _handleViewport(width, height) {
    let code = this._options.viewportCode.replace(/\${frame}/g, this._frame).replace(/\${width}/g, width).replace(/\${height}/g, height)
    return new Block(this._frameId, { type: pptrActions.VIEWPORT, value: code })
  }

  _handleWaitForNavigation() {
    const block = new Block(this._frameId)
    if (this._options.waitForNavigation) {
      block.addLine({ type: pptrActions.NAVIGATION, value: `await navigationPromise` })
    }
    return block
  }

  _handleReadData(selector, dinamicData, varData) {
    const block = new Block(this._frameId)
    let code = ''
    if (this._options.waitForNavigation) {
      if (dinamicData) {
        code = this._options.readWaitDinamicDataCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${varData}/g, varData)
      } else {
        code = this._options.readWaitDataCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${varData}/g, varData)
      }


    } else {
      if (dinamicData) {
        code = this._options.readDinamicDataCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${varData}/g, varData)
      } else {
        code = this._options.readDataCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${varData}/g, varData)
      }
    }

    block.addLine({ type: domEvents.KEYDOWN, value: code })


    return block
  }

  _postProcessSetFrames() {
    for (let [i, block] of this._blocks.entries()) {
      const lines = block.getLines()
      for (let line of lines) {
        if (line.frameId && Object.keys(this._allFrames).includes(line.frameId.toString())) {
          const declaration = `const frame_${line.frameId} = frames.find(f => f.url() === '${this._allFrames[line.frameId]}')`
          this._blocks[i].addLineToTop(({ type: pptrActions.FRAME_SET, value: declaration }))
          this._blocks[i].addLineToTop({ type: pptrActions.FRAME_SET, value: 'let frames = await page.frames()' })
          delete this._allFrames[line.frameId]
          break
        }
      }
    }
  }

  _postProcessAddBlankLines() {
    let i = 0
    while (i <= this._blocks.length) {
      const blankLine = new Block()
      blankLine.addLine({ type: null, value: '' })
      this._blocks.splice(i, 0, blankLine)
      i += 2
    }
  }
}

/*
* Almacena las opciones de usuario de la extension
*/
CodeGenerator.userOptions = {}
/*
chrome.storage.onChanged.addListener((changes, areaName) => {
  console.debug('Han cambiado las propiedades')
  console.debug(CodeGenerator.userOptions)
   debugger
 })
*/
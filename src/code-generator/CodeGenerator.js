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

const wrappedFooter = `  
})()`

const varData="${varData}"
const selector="${selector}"
const frame="${frame}"
const functionName="${functionName}"
const templateCode="${templateCode}"
const nodes="${nodes}"
const customCode="${customCode}"

export const defaults = {
  customSelector: true,
  sandboxUrl: 'http://localhost:8124',
  wrapAsync: true,
  headless: true,
  waitForNavigation: true,
  waitForSelectorOnClick: true,
  blankLinesBetweenBlocks: true,
  dataAttribute: '',
  // code: {
  handleWaitNavigationCode:  `await navigationPromise`,  
  dontKeepAliveCode:  `await browser.close()`, 
  footerCode:  `}
  
  module.exports ={
    ${functionName}: ${functionName}
  }`,
  wrapperFooterCode: `  
  })()}
  
  module.exports ={
    ${functionName}: ${functionName}
  }`,   
  headerCode:  `async function ${functionName}(globalVar, eventEmitter){
  const constants=require('./constants.js')
   const puppeteer = require('puppeteer');
   const fs = require('fs')
  const keyboardMapping = require('./USKeyboardLayout.js');
  const browser = await puppeteer.launch(constants.PUPPETEER_OPTS)
  const page = await browser.newPage()`, 
  wrapperHeaderCode:  `function ${functionName}(globalVar, eventEmitter){
  (async () => {
    const constants=require('./constants.js')
    const fs = require('fs')
    const puppeteer = require('puppeteer');
    const fs= require('fs')
    const keyboardMapping = require('./USKeyboardLayout.js');
    const browser = await puppeteer.launch(constants.PUPPETEER_OPTS)
    const page = await browser.newPage()`, 
  clickCode: '  await ${frame}.click("${selector}");',
  waitClickCode: '  await ${frame}.waitForSelector("${selector}");\n await ${frame}.click("${selector}");',
  keyDownCode: '  await ${frame}.keyboard.down(keyboardMapping.keyCodeLayout[${keyCode}].code)',
  keyUpCode: '  await ${frame}.keyboard.up(keyboardMapping.keyCodeLayout[${keyCode}].code)',
  changeCode: ' await ${frame}.select("${selector}", "${value}")',
  goToCode: ' await ${frame}.goto("${href}")',
  viewportCode: ' await ${frame}.setViewport({ width: ${width}, height: ${height} })',
  readDataCode: 
    ` globalVar.${varData}=await ${frame}.evaluate(element => {
        let obj= document.querySelector("${selector}");
        if(obj.options) return obj.options[obj.selectedIndex].innerHTML
        if(obj.value) return obj.value
        return obj.innerHTML
        });`,
  readDinamicDataCode: ` page.exposeFunction('${varData}_puppeteerMutationListener', function(value){
     globalVar['${varData}']=value;
     console.log(globalVar);
     eventEmitter.emit('changeData',value);
  });
  await ${frame}.evaluate(element => { 
    let observer = new MutationObserver(
    function() {
      let value=null;
      let obj= document.querySelector("${selector}");
      if(obj.options) value = obj.options[obj.selectedIndex].innerHTML
      if(obj.value) value = obj.value
      value = obj.innerHTML
      ${varData}_puppeteerMutationListener(value)
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
  });`,
  readWaitDataCode: 
  ` await ${frame}.waitForSelector("${selector}")
    globalVar.${varData}=await ${frame}.evaluate(element => {
      let obj= document.querySelector("${selector}");
      if(obj.options) return obj.options[obj.selectedIndex].innerHTML
      if(obj.value) return obj.value
      return obj.innerHTML
      });`,
  readWaitDinamicDataCode: `  await ${frame}.waitForSelector("${selector}")
    page.exposeFunction('${varData}_puppeteerMutationListener', function(value){
       globalVar['${varData}']=value;
       console.log(globalVar);
       eventEmitter.emit('changeData',value);
    });
    await ${frame}.evaluate(element => { 
      let observer = new MutationObserver(
      function() {
        let value=null;
        let obj= document.querySelector("${selector}");
        if(obj.options) value = obj.options[obj.selectedIndex].innerHTML
        if(obj.value) value = obj.value
        value = obj.innerHTML
        ${varData}_puppeteerMutationListener(value)
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
    });`,
    templateCode:{'generic':` await ${frame}.evaluate(fs.readFileSync('./TemplateGenerator.js', 'utf8')); 
    await ${frame}.evaluate(element => {
          ${templateCode}
    })`,
    'staticData':` (new TemplateGenerator(${nodes})).staticData()`,
    'dinamicData':` (new TemplateGenerator(${nodes})).dinamicData(${customCode})`
  }

  // }
}

export default class CodeGenerator {
  constructor(options) {
    this._options = Object.assign(defaults, options)
    this._blocks = []
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this.newPage=true

    this._hasNavigation = false
  }

  static get userOptions() {
    // If `_foo` is inherited or doesn't exist yet, treat it as `undefined`
    return this.hasOwnProperty('_userOptions') ? this._userOptions : void 0
  }
  static set userOptions(v) { this._userOptions = v }
  /**
   * 
   * @param {*} events Lista de eventos para genera código
   * @param {*} params {functionName: Nombre del metodo a generar, keepAlive: Indica si se cerrará el navegador al final o queda abierto}
   * 
   */
  generate(events, params) {
    return  this._getHeader(params.functionName) + this._parseEvents(events) + this._getFooter(params.keepAlive,params.functionName)
  }

  _getHeader(functionName) {
   
    console.debug(this._options)
   // let hdr = this._options.wrapAsync ? wrappedHeader : header
   // hdr = this._options.headless ? hdr : hdr.replace('launch()', 'launch({ headless: false })')

   if (this._options.wrapAsync)
    return this._options.wrapperHeaderCode.replace(/\${functionName}/g, functionName)
  return this._options.headerCode.replace(/\${functionName}/g, functionName)
  }

  _getFooter(keepAlive,functionName) {
    let code= ''
    if(!keepAlive)
      code=this._options.dontKeepAliveCode;
    if(this._options.wrapAsync)
      code+=this._options.wrapperFooterCode.replace(/\${functionName}/g, functionName);
    else  
    code+=this._options.footerCode.replace(/\${functionName}/g, functionName);
    return code
    
  }
     /**
      * 
      * @param {*} selector tiene todos los datos serializados
      * @param {*} value la funcion asociada
      * @param {*} href Codigo custom
      */
  _getTemplateCode(selector,value,href){
   
    let nodes=selector;
    let action=value;

    //Se selecciona la funcion deseada
    let code=this._options.templateCode.generic.replace(/\${templateCode}/g,this._options.templateCode[value]);
    //se reemplazan los elementos capturados
    code=code.replace(/\${nodes}/g,selector);
    //si los hubiera, se setea codigo custom
    code=code.replace(/\${customCode}/g,href);

    code=code.replace(/\${frame}/g,frame);
    return code;
    
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
          case 'keyup':
            // if (keyCode === 9) { // tab key
            //   this._blocks.push(this._handleKeyDown(selector, value, keyCode))
            // }
            if (keyCode !== 113) { // F2
              this._blocks.push(this._handleKeyUp(selector, value, keyCode))
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
          if(this.newPage){
          this._blocks.push(this._handleGoto(href, frameId))
            this.newPage=false
          }else{
            this._blocks.push(this._handleWaitForNavigation())
            this._hasNavigation = true
          }

          break
        case 'viewport*':
          this._blocks.push((this._handleViewport(value.width, value.height)))
          break
        case 'navigation*':
          this._blocks.push(this._handleWaitForNavigation())
          this._hasNavigation = true
          break
        case 'template':
            const block = new Block(this._frameId)
           
            block.addLine({ type: domEvents.TEMPLATE, value: this._getTemplateCode(frameId,selector,value,href,keyCode) })
            this._blocks.push(block)
          break;  
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

  _handleKeyDown(selector, value,keyCode) {
    //value es la cadena obtenida del input pero solo nos interesa la ultima tecla pulsada
   
    const block = new Block(this._frameId)
    let code = this._options.keyDownCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${value}/g, value).replace(/\${keyCode}/g, keyCode)
    block.addLine({ type: domEvents.KEYDOWN, value: code })
    return block
  }

  _handleKeyUp(selector, value,keyCode) {
    //value es la cadena obtenida del input pero solo nos interesa la ultima tecla pulsada
   
    const block = new Block(this._frameId)
    let code = this._options.keyUpCode.replace(/\${frame}/g, this._frame).replace(/\${selector}/g, selector).replace(/\${value}/g, value).replace(/\${keyCode}/g, keyCode)
    block.addLine({ type: domEvents.KEYUP, value: code })
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

      block.addLine({ type: pptrActions.NAVIGATION, value: this._options.handleWaitNavigationCode })
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
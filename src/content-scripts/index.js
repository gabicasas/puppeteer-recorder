import eventsToRecord from '../code-generator/dom-events-to-record'
import finder from '@medv/finder'
import Simmer from 'simmerjs'
import Bridge from 'crx-bridge';
import TemplateGenerator from './TemplateGenerator';

/*

Este es el que se ejecuta en la pagina desde el incio



*/


//chrome.debugger.getTargets((targets) => {
//  debugger
//})


class EventRecorder {
  constructor () {
    console.log("Construyendo")
    this.eventLog = []
    this.previousEvent = null
    this.dataAttribute = null
    this.isTopFrame = (window.location === window.parent.location)
    this.actualSelector=null
    this.customSelector=false

    this.simmer = new Simmer(window, { /* some custom configuration */ })
  }

  start () {
    // We need to check the existence of chrome for testing purposes
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['options'], ({options}) => {
        const { dataAttribute, customSelector } = options ? options.code : {}
        if (dataAttribute) {
          this.dataAttribute = dataAttribute
        }
        this.customSelector = customSelector;
        this._initializeRecorder()
      })
    } else {
      this._initializeRecorder()
    }
  }

  

  _initializeRecorder () {

    window.addEventListener('mousemove', (evt) => {
      window.positionglobal=evt;
     
      if(this.customSelector)
        this.actualSelector= obtainCssSelector(evt.path[0])
      else
        this.actualSelector=this.simmer(evt.path[0]);
      //console.log(this.customSelector);  
      //console.log(this.actualSelector);
    });

    const events = Object.values(eventsToRecord)
    if (!window.pptRecorderAddedControlListeners) {
      this.addAllListeners(events)
      window.pptRecorderAddedControlListeners = true
    }

    if (!window.document.pptRecorderAddedControlListeners && chrome.runtime && chrome.runtime.onMessage) {
      window.document.pptRecorderAddedControlListeners = true
    }

    if (this.isTopFrame) {
     /*
      this.sendMessage({ control: 'event-recorder-started' })
      this.sendMessage({ control: 'get-current-url', href: window.location.href })
      this.sendMessage({ control: 'get-viewport-size', coordinates: { width: window.innerWidth, height: window.innerHeight } })
     */
    this.sendMessage({ action: 'event-recorder-started' })
      this.sendMessage({ action: 'goto*', href: window.location.href })
      this.sendMessage({ action: 'viewport*', value: { width: window.innerWidth, height: window.innerHeight } })
      console.debug('Puppeteer Recorder in-page EventRecorder started')
    }
  }

  addAllListeners (events) {
    const boundedRecordEvent = this.recordEvent.bind(this)
    events.forEach(type => {
      window.addEventListener(type, boundedRecordEvent, true)
    })
  }

  changeDevToolsSelector(element, event, index){
  
   
    if(element.nodeType==3) //Si es un nodo de texto hay que utilizar el padre
      element=element.parentNode;
    let selector=this.simmer(element);
    if(this.customSelector)
      selector= obtainCssSelector(element)
    event.selector=selector;
    Bridge.sendMessage('changeSelector', {index:index,event:event}, 'devtools')
    Bridge.sendMessage('changeSelector', {index:index,event:event}, 'content-script')
  }
  sendMessage (msg) {
   
    console.log('Mensaje enviado')
    Bridge.sendMessage('do-stuff', msg, 'background')
    Bridge.sendMessage('do-stuff', msg, 'devtools')
    Bridge.sendMessage('do-stuff', msg, 'content-script')
    console.debug('sending message', msg)
    try {
      // poor man's way of detecting whether this script was injected by an actual extension, or is loaded for
      // testing purposes
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.sendMessage(msg)
      } else {
        this.eventLog.push(msg)
      }
    } catch (err) {
      console.debug('caught error', err)
    }
  }

  recordEvent (e) {
    if(e.type==="keyup"  && e.keyCode===113){
      console.debug("No se guarda el soltado de F2")
      return;
    }
    
    console.log('Evento grabado')
    console.log(e)
    if (this.previousEvent && this.previousEvent.timeStamp === e.timeStamp) return
    this.previousEvent = e

    // we explicitly catch any errors and swallow them, as none node-type events are also ingested.
    // for these events we cannot generate selectors, which is OK
    try {
      // Aqui se obtiene e selector a aprtir del evento
      let selector = this.dataAttribute && e.target.hasAttribute && e.target.hasAttribute(this.dataAttribute)
        ? formatDataSelector(e.target, this.dataAttribute)
        : finder(e.target, {seedMinLength: 5, optimizedMinLength: 10})
     /* if(e.type.indexOf("key")!=-1)


        debugger;*/

        if(this.customSelector)
          selector= obtainCssSelector(e.target)
        console.log("customSelector",this.customSelector)

      const msg = {
        selector: (e.type==="keydown" && e.keyCode===113)?this.actualSelector:selector,
        value: e.target.value,
        tagName: e.target.tagName,
        action: e.type,
        keyCode: e.keyCode ? e.keyCode : null,
        href: e.target.href ? e.target.href : null,
        coordinates: getCoordinates(e)
      }
      // Si se presiona F2 (113)  se envia la accion para observar apuesta (ver como hacer el click derecho)
    
      // Seguarda la url para posteriormente procesarlo y enviarlo a servidor
      msg.actualUrl = window.location.href
      console.log(msg)
      this.sendMessage(msg)
    } catch (e) {}
  }

  getEventLog () {
    return this.eventLog
  }

  clearEventLog () {
    this.eventLog = []
  }
}

function getCoordinates (evt) {
  const eventsWithCoordinates = {
    mouseup: true,
    mousedown: true,
    mousemove: true,
    mouseover: true
  }
  return eventsWithCoordinates[evt.type] ? { x: evt.clientX, y: evt.clientY } : null
}

function formatDataSelector (element, attribute) {
  return `[${attribute}="${element.getAttribute(attribute)}"]`
}


function obtainCssSelector(myElement) {
  let selectors = [];
  let mySelector = function(element) {
    if (element.tagName == "BODY") {
      selectors.push("body");
      return;
    } else {
     
      if (element.parentNode) {
        let selector = element.tagName;
        for (let i = 0; i < element.parentNode.children.length; i++) {
          if (element == element.parentNode.children[i])
            selector += ":nth-child(" + (i + 1) + ")";
        }
        selectors.push(selector);
        mySelector(element.parentNode);
      }
    }
  };

  mySelector(myElement);

  var result = "";
  for (var i = selectors.length - 1; i >= 0; i--) {
    result += selectors[i];
    if (i != 0) result += " > ";
  }
  return result;
}

window.eventRecorder = new EventRecorder()
window.eventRecorder.start()
window.__templateGenerator__= new TemplateGenerator();
window.__templateGenerator__.start()

import Bridge from 'crx-bridge';
export default class TemplateGenerator {
  constructor() {
    // Elemento seleccionado
    this.datoDom = null;
    // Padre superior del elemento seleccionado
    this.parentDatoDom = null;
    // Nodos de la plantilla seleccionda
    this.nodes = null;
    // Guarda el selector en formato estructurado del elemento seleccionado
    this.selector = null;
    // Guarda el selector css relativo del elemento seleccionado
    this.selectorCss = null;

    /*
Modelo de datos
-selector cortado
-cadena de nodos text
var items=[{selector:aa, nodos:...}]
*/
    this.items = [];
    this.calculatedItems = [];
    this.result = {}; // alberga los resultados

    window.addEventListener("mousemove", evt => {
      window.mousePositionEvt = evt;
    });

    window.addEventListener("keydown", evt => {
      
      if (evt.keyCode == 118 || evt.key=="q") {
        //F7 par cargar el dato
        //Se pausa la lectura de info
        Bridge.sendMessage('pause',{}, 'background')
        Bridge.sendMessage('pause', {}, 'devtools')
        this.datoDom = window.mousePositionEvt.target;
        this.parentDatoDom = this.datoDom;
        this.datoDom.style.border = "1px dashed red";
        console.log("DATO SELECCIONADO. (SIG w/F8 para seleccionar padre)", this.datoDom);
      } else if (evt.keyCode == 119 || evt.key=="w") {
        //F8 para buscar padre
        this.parentDatoDom = this.parentDatoDom.parentNode;
        this.parentDatoDom.style.border = "1px dashed green";
        console.log("PADRE SELECCIONADO.(SIG e/F9 para obtener selector o w/F8 para cambiar padre)", this.parentDatoDom);
      } else if (evt.keyCode == 120 || evt.key=="e") {
        //F9 para guardar template
        //debugger;
        this.selector = this.obtainCssSelector(this.datoDom, this.parentDatoDom);
        let nodos = this.textNodesUnder(this.parentDatoDom);

        /* nodos.map(nodo => {
   nodo.node.parentNode.addEventListener("click", (e) =>{
   });
})  */
        this.selectorCss = this.selectorDom(this.selector);
        document.querySelectorAll(this.selectorCss).forEach(element => {
          let newParent = element;
          for (let i = 0; i < this.selector.length; i++)
            newParent = newParent.parentNode;
          let newSelector = this.obtainCssSelector(element, newParent);
          let newNodos = this.textNodesUnder(newParent);
          if (newNodos.length == nodos.length) {
            //Esto es una forma de saberque la estructura del dom es similar
            let newItem = {
              selector: newSelector,
              nodos: newNodos
            }; // Para guardar en lista auxiliar
            this.calculatedItems.push(newItem);
            element.style.border = "1px dashed green";
          }
        });
        //los guardo para el evento que seleccina el texto fijo
        this.nodes = nodos;
        this.items.push({ selector: this.selector, nodos: nodos });
        this.datoDom = null;
        this.parentDatoDom = null;
        console.log("OBTENIDO SELECTOR. (SIG r/F2 para obtener textos identificativos)", this.items);
      } else if (evt.keyCode == 113 || evt.key=="r") {
        //F2 para seleccionar los textos fijos
        this.nodes.map(nodo => {
          if (nodo.node == window.mousePositionEvt.target.firstChild) {
            //firstChild asegura bajar al texto
            nodo.node.parentNode.style.border = "1px dashed blue";
            nodo.fixed = true;
          }
        });
        console.log('OBTENIDOS TEXTOS.(SIG t/F10 para dar nombre o r/F2 par mas textos)')
      } else if (evt.keyCode == 121 || evt.key=="t") {
        console.log("aa");
       
        console.log("Se envia a la extension el dato")
        const msg = {
          selector: JSON.stringify({selector: this.selectorCss, selectorDom:this.selector,nodes: this.nodes}),
          value: null,
          tagName: null,
          action: "template",
          keyCode:  null,
          href:  null,
          coordinates: null
        }
        Bridge.sendMessage('pause',{}, 'background')
        Bridge.sendMessage('pause', {}, 'devtools')
        Bridge.sendMessage('do-stuff',msg, 'background')
        Bridge.sendMessage('do-stuff', msg, 'devtools')
       // Bridge.sendMessage('do-stuff', msg, 'content-script')
        
       //F10 Actualizar nodos fijos
        /* alert('actualiza nodos fijos');
this.nodes.map(nodo => {
   ttttttt ///Actualizar los nodos de  this.calculatedItems
})*/
        for (let i = 0; i < this.nodes.length; i++) {
          if (this.nodes[i].fixed) {
            for (let j = 0; j < this.calculatedItems.length; j++) {
              this.calculatedItems[j].nodos[i].fixed = true;
              this.calculatedItems[j].nodos[i].node.parentNode.style.border =
                "1px dashed blue";
            }
            //this.calculatedItems.forEach(item => item.nodos[i].fixed=true);
          }
        }
        let id = prompt("Introduzca id");
        //Se añade el id a los que no tienen
        this.items.forEach(item => {
          if (!item.id) {
            item.id = id;
          }
        });

        this.calculatedItems.forEach(el => {
          el.id = id;
          this.items.push(el);
        });
        this.calculatedItems = [];
      }
    });
  }
  start() {
    console.log("aranacado templateGenerator "+window.location.href);
  }

  //TODO, filtar par eliminar los texto vaciones con el filtro de la propia funcion
  textNodesUnder(el) {
    var n,
      a = [],
      walk = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        node => {
          /*
if(escape(node.nodeValue).replace(/%0A/g,"").replace(/%20/g,"").replace(/%09/g,"").length==0) // se salta espacios en blanco
return NodeFilter.FILTER_REJECT;
*/

          return NodeFilter.FILTER_ACCEPT;
        },
        false
      );
    while ((n = walk.nextNode())) a.push({ node: n, value: n.nodeValue });
    return a;
  }

  //Devuelve la lista de nodos de un template o elemento para que sea mas facil de comparar con el DOM
  listaNodosTemplate(el) {
    var n,
      a = [],
      walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) a.push(n);
    return a;
  }

  obtainTemplate(templateChild) {
    let textNodesChilds = this.textNodesUnder(templateChild);
    let parent = templateChild.parentNode;
    while (this.textNodesUnder(parent).length == textNodesChilds.length)
      parent = parent.parentNode;

    return parent;
  }

  obtainCssSelector(myElement, firstParentElement) {
    let selectors = [];

    let mySelector = function(element) {
      if (element == firstParentElement) {
        return;
      } else {
        //debugger;
        if (element.parentNode) {
          var selector = {};
          selector.tag = element.tagName;
          for (let i = 0; i < element.parentNode.children.length; i++) {
            if (element == element.parentNode.children[i]) {
              // selector.child=":nth-child("+(i+1)+")";
              selector.child = i;
            }
          }

          selectors.push(selector);
          mySelector(element.parentNode);
        }
      }
    };

    mySelector(myElement);

    /*var this.result="";
for(var i=selectors.length-1;i>=0;i--){
this.result+=selectors[i]
if(i!=0)
this.result+= " > "
}
return this.result;*/

    return selectors;
  }

  selectorDom(selectors) {
    var result = "";
    for (var i = selectors.length - 1; i >= 0; i--) {
      result +=
        selectors[i].tag + ":nth-child(" + (selectors[i].child + 1) + ")";
      if (i != 0) result += " > ";
    }
    return result;
  }

  observeChanges() {
    //Todos los cambios
    observer = new MutationObserver(function(a) {
      a.map(element => {
        //console.log(obtainCssSelector(element.target, document.body));

        this.items.map(item => {
          var isThisItem = true;
          //Buscamos el psoible padore en funcion de lo largo de la cadena del selector

          var start = 0;
          var end = item.selector.length;
          var nodes = [];
          //Se busca el caso en que el nodo que cambio no es solo el texto
          while (nodes.length != 1 && end != 0) {
            nodes = element.target.querySelectorAll(
              selectorDom(item.selector.slice(start, end))
            );
            end--;
          }

          //Será el nodo con el texto a a auditar
          var target = null;
          if (
            nodes.length == 1 &&
            nodes[0].firstChild &&
            nodes[0].firstChild.nodeName == "#text"
          ) {
            target = nodes[0];
          } else {
            //En caso de que solo haya cambiado el texto no vale la estrategia del selector
            target = element.target;
          }

          if (target) {
            // Sera el nodo padre de varios niveles coinicidnete con el selector y los nodos de texto fijos
            var parent = target;
            for (var i = 0; i < item.selector.length && isThisItem; i++) {
              if (
                isThisItem &&
                item.selector[i].tag == parent.tagName &&
                parent.parentNode.children[item.selector[i].child] == parent
              )
                isThisItem = true;
              else isThisItem = false;
              parent = parent.parentNode;
            }
            if (isThisItem) {
              //Se calcula el numero de nodos de texto a ver si coincide
              let nodosPosibles = listaNodosTemplate(parent);
              if (nodosPosibles.length == item.nodos.length) {
                //console.log('puede ser',item, parent);
                for (let i = 0; i < item.nodos.length; i++) {
                  if (item.nodos[i].fixed) {
                    isThisItem =
                      item.nodos[i].value == nodosPosibles[i].nodeValue &&
                      isThisItem;
                  }
                }
              } else {
                isThisItem = false;
              }
            }

            if (isThisItem) {
              item.key = "";
              item.nodos.map(nodo => {
                if (nodo.fixed) item.key += "$$$" + nodo.value;
              });
              item.value = target.firstChild.nodeValue;
              console.info(item);
              if (!this.result[item.id]) this.result[item.id] = {};
              this.result[item.id][item.key] = item.value;
            }
          }
        });
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

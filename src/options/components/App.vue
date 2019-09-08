<template>
  <div class="options">
    <div class="container">
      <div class="header">
        Puppeteer Recorder Options
        <small class="saving-badge text-muted" v-show="saving">Saving...</small>
      </div>
      <div class="content" v-if="!loading">
        <b-tabs content-class="mt-3" justified>
          <b-tab title="Opciones generales" active>
            <div class="settings-block">
              <h4 class="settings-block-title">Code Recorder settings</h4>
              <div class="settings-block-main">
                <div class="settings-group">
                  <label class="settings-label">URL del Sanbox</label>
                  <input
                    id="options-code-dataAttribute"
                    type="text"
                    v-model="options.code.sandboxUrl"
                    @change="save"
                    placeholder="Introduce aqui la URL"
                  />
                  <small>
                    Define el endpoint donde está escuchando el sandbox al que enviaremose código a ejecutar
                  </small>
                </div>
  <div class="settings-group">
                  <label>
                    <input
                    
                      type="checkbox"
                      v-model="options.code.customSelector"
                      @change="save"
                    />
                    Indica si se usa selector sin id´s
                  </label>
                </div>
                 


              <!--  <div class="settings-group">
                  <label class="settings-label">custom data attribute</label>
                  <input
                    id="options-code-dataAttribute"
                    type="text"
                    v-model="options.code.dataAttribute"
                    @change="save"
                    placeholder="your custom data-* attribute"
                  />
                  <small>
                    Define a
                    <code>data-*</code> attribute that we'll attempt to use when selecting the elements. This is handy
                    when React or Vue based apps generate random class names.
                  </small>
                </div> -->
              </div>
            </div>
            <div class="settings-block">
              <h4 class="settings-block-title">Code Generator settings</h4>
              <div class="settings-block-main">
                <div class="settings-group">
                  <label>
                    <input
                      id="options-code-wrapAsync"
                      type="checkbox"
                      v-model="options.code.wrapAsync"
                      @change="save"
                    />
                    wrap code in async function
                  </label>
                </div>
               <!-- <div class="settings-group">
                  <label>
                    <input
                      id="options-code-headless"
                      type="checkbox"
                      v-model="options.code.headless"
                      @change="save"
                    />
                    set
                    <code>headless</code> in puppeteer launch options
                  </label>
                </div> -->
                <div class="settings-group">
                  <label>
                    <input
                      id="options-code-waitForNavigation"
                      type="checkbox"
                      v-model="options.code.waitForNavigation"
                      @change="save"
                    />
                    add
                    <code>waitForNavigation</code> lines on navigation
                  </label>
                </div> 
                <div class="settings-group">
                  <label>
                    <input
                      id="options-code-waitForSelectorOnClick"
                      type="checkbox"
                      v-model="options.code.waitForSelectorOnClick"
                      @change="save"
                    />
                    add
                    <code>waitForSelector</code> lines before every
                    <code>page.click()</code>
                  </label>
                </div>
                <div class="settings-group">
                  <label>
                    <input
                      id="options-code-blankLinesBetweenBlocks"
                      type="checkbox"
                      v-model="options.code.blankLinesBetweenBlocks"
                      @change="save"
                    />
                    add blank lines between code blocks
                  </label>
                </div>
              </div>
            </div>

           
          </b-tab>

          <b-tab title="Generador" active>
            <b-form>
              <b-tabs pills card vertical>
                <b-tab title="Cabecera y pie" active>
                  <b-card-text>Define el código de la cabecera e inicio de función</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {functionName}"
                      label-for="options-code-header"
                    >
                      <b-form-textarea
                        id="options-code-header"
                        v-model="options.code.headerCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                  
                    <b-button @click="options.code.headerCode=defaultCode.code.headerCode;save()">Reset</b-button>
                  </div>

                   <b-card-text>Define el código de la cabecera e inicio de función par cuerpos asincronos</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {functionName}"
                      label-for="options-code-wheader"
                    >
                      <b-form-textarea
                        id="options-code-wheader"
                        v-model="options.code.wrapperHeaderCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                  
                    <b-button @click="options.code.wrapperHeaderCode=defaultCode.code.wrapperHeaderCode;save()">Reset</b-button>
                  </div>

                  <b-card-text>Define el código de fin de función</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {functionName}"
                      label-for="options-code-footer"
                    >
                      <b-form-textarea
                       
                        v-model="options.code.footerCode"
                        @change="save"
                        placeholder="add multiple lines"
                        id="options-code-footer"
                      ></b-form-textarea>
                    </b-form-group>
                  
                    <b-button @click="options.code.footerCode=defaultCode.code.footerCode;save()">Reset</b-button>
                  </div>

                  <b-card-text>Define el código de fin de función asincrona</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                     label="Variables disponibles: {functionName}"
                      label-for="options-code-wfooter"
                    >
                      <b-form-textarea
                       
                        v-model="options.code.wrapperFooterCode"
                        @change="save"
                        placeholder="add multiple lines"
                        id="options-code-wfooter"
                      ></b-form-textarea>
                    </b-form-group>
                  
                    <b-button @click="options.code.wrapperFooterCode=defaultCode.code.wrapperFooterCode;save()">Reset</b-button>
                  </div>

 <b-card-text>Define el código para cerrar el browser al final de la función si no hay lectura continua de datos (en función de si se setea keepAlive)</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                     
                    >
                      <b-form-textarea
                       
                        v-model="options.code.dontKeepAliveCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                  
                    <b-button @click="options.code.dontKeepAliveCode=defaultCode.code.dontKeepAliveCode;save()">Reset</b-button>
                  </div>


                </b-tab>

                <b-tab title="onClick" active>
                  <b-card-text>Define el codigo que quiere que sea generado para simular un click de raton</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{selector}"
                      label-for="options-code-onClick"
                    >
                      <b-form-textarea
                        id="options-code-onClick"
                        v-model="options.code.clickCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="resetClick">Reset</b-button>
                    <b-card-text><br/>Define el codigo que quiere que sea generado para simular un click de raton  esperando a que el selector este disponible</b-card-text>
                    <b-form-group
                      label=" Variables disponibles: {frame},{selector}"
                      label-for="options-code-wait-onClick"
                    >
                      <b-form-textarea
                        id="options-code-wait-onClick"
                        v-model="options.code.waitClickCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.waitClickCode=defaultCode.code.waitClickCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="onKeyDown" active>
                  <b-card-text>Define el codigo que quiere que sea generado para simular una pulsacion de tecla</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{selector},{value},{keyCode}"
                      label-for="options-code-onKeyDown"
                    >
                      <b-form-textarea
                        id="options-code-onKeyDown"
                        v-model="options.code.keyDownCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                      <b-button @click="options.code.keyDownCode=defaultCode.code.keyDownCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="onKeyUp" active>
                  <b-card-text>Define el codigo que quiere que sea generado para simular cuando se suelta una tecla</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{selector},{value},{keyCode}"
                      label-for="options-code-onKeyUp"
                    >
                      <b-form-textarea
                        id="options-code-onKeyUp"
                        v-model="options.code.keyUpCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                      <b-button @click="options.code.keyUpCode=defaultCode.code.keyUpCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="Change" active>
                  <b-card-text>Define el codigo que quiere que sea generado para simular Change (Pendiente de ver que es)</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{selector},{value}"
                      label-for="options-code-change"
                    >
                      <b-form-textarea
                        id="options-code-change"
                        v-model="options.code.changeCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                       
                    </b-form-group>
                    <b-button @click="options.code.changeCode=defaultCode.code.changeCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="Go to" active>
                  <b-card-text>Define el codigo que quiere que sea generado para simular el cambio de pagina (actualización de window.location)</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{href}"
                      label-for="options-code-goTo"
                    >
                      <b-form-textarea
                        id="options-code-goTo"
                        v-model="options.code.goToCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.goToCode=defaultCode.code.goToCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="Handle viewPort" active>
                  <b-card-text>Define el codigo que maneja el cambio del tamaño de pantalla</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{width},{height}"
                      label-for="options-code-viewport"
                    >
                      <b-form-textarea
                        id="options-code-viewport"
                        v-model="options.code.viewportCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.viewportCode=defaultCode.code.viewportCode;save()">Reset</b-button>
                  </div>
                </b-tab>

                <b-tab title="Read Data" active>
                  <b-card-text>Define el codigo para leer información estática</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                      label="Variables disponibles: {frame},{selector}"
                      label-for="options-code-readData"
                    >
                      <b-form-textarea
                        id="options-code-readData"
                        v-model="options.code.readDataCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.readDataCode=defaultCode.code.readDataCode;save()">Reset</b-button>
                    <br/>
                  <b-card-text> <br/>Define el codigo para leer información dinámica</b-card-text>
                    <b-form-group
                      label="Variables disponibles: {frame}"
                      label-for="options-code-readDinamicData"
                    >
                      <b-form-textarea
                        id="options-code-readDinamicData"
                        v-model="options.code.readDinamicDataCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.readDinamicDataCode=defaultCode.code.readDinamicDataCode;save()">Reset</b-button>
                    <b-card-text> <br/>Define el codigo para leer información estática (con espera a que el selector este disponible )</b-card-text>
                      <b-form-group
                      label="Wait Variables disponibles: {frame}"
                      label-for="options-code-readWaitData"
                    >
                      <b-form-textarea
                        id="options-code-readWaitData"
                        v-model="options.code.readWaitDataCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                     <b-card-text> <br/>Define el codigo para leer información dinámica (con espera a que el selector este disponible )</b-card-text>  
                    </b-form-group>
                      <b-button @click="options.code.readWaitDataCode=defaultCode.code.readWaitDataCode;save()">Reset</b-button>
                    <b-form-group
                      label="Wait Dinamic Variables disponibles: {frame}"
                      label-for="options-code-readDinamicWaitData"
                    >
                      <b-form-textarea
                        id="options-code-readDinamicWaitData"
                        v-model="options.code.readWaitDinamicDataCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.readWaitDinamicDataCode=defaultCode.code.readWaitDinamicDataCode;save()">Reset</b-button>

                  </div>
                </b-tab>

                <b-tab title="Wait Navigation" active>
                  <b-card-text>Define el codigo necesario para esperar la carga de una nueva pagina</b-card-text>
                  <div class="settings-group">
                    <b-form-group
                     
                    >
                      <b-form-textarea
                       
                        v-model="options.code.handleWaitNavigationCode"
                        @change="save"
                        placeholder="add multiple lines"
                      ></b-form-textarea>
                    </b-form-group>
                    <b-button @click="options.code.handleWaitNavigationCode=defaultCode.code.handleWaitNavigationCode;save()">Reset</b-button>
                  </div>
                </b-tab>









                

               
              </b-tabs>
            </b-form>
          </b-tab>
        </b-tabs>
      </div>
      <div class="footer">
       
      </div>
    </div>
  </div>
</template>

<script>
import { defaults as code } from "../../code-generator/CodeGenerator";

const defaults = {
  code
};

export default {
  name: "App",
  data() {
    return {
      loading: true,
      saving: false,
      options: defaults,
      defaultCode: {}
    };
  },
  mounted() {
    this.load();
  },
  methods: {

    
    resetClick() {
      this.options.code.clickCode=this.defaultCode.code.clickCode
    },
    save() {
      this.saving = true;
      this.$chrome.storage.local.set({ options: this.options }, () => {
        console.debug("saved options");
        setTimeout(() => {
          this.saving = false;
        }, 500);
      });
    },
    load() {
      this.defaultCode = JSON.parse(JSON.stringify(defaults))
      this.$chrome.storage.local.get("options", ({ options }) => {
        if (options) {
          console.debug("loaded options", JSON.stringify(options));
          for(let i in options){
            this.options[i]=options[i];
          }
          //this.options = options;
        }
        this.loading = false;
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~styles/_variables.scss";
@import "~styles/_mixins.scss";
@import "node_modules/bootstrap/scss/bootstrap";
@import "node_modules/bootstrap-vue/src/index.scss";

.options {
  height: 100%;
  min-height: 580px;
  background: $gray-lighter;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  position: fixed;
  left: 0;
  top: 0;

  .container {
    padding: 0 2 * $spacer;
   /* width: 550px; */
    margin: 0 auto;

    .content {
      background: white;
      padding: 2 * $spacer;
      border-radius: 4px;
      min-height: 500px;
    }

    .footer {
      @include footer();
      background: $gray-lighter;
      font-weight: normal;
      justify-content: center;
      img {
        margin-left: 8px;
        width: 80px;
        vertical-align: middle;
      }
    }

    .header {
      @include header();
      background: $gray-lighter;
      justify-content: space-between;
    }

    .settings-block {
      .settings-label {
        display: block;
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 500;
        margin-bottom: $spacer;
      }

      .settings-block-title {
        margin: 0;
        padding-bottom: $spacer;
        border-bottom: 1px solid $gray-light;
      }
      .settings-block-main {
        padding: $spacer 0;
        margin-bottom: $spacer;

        .settings-group {
          margin-bottom: $spacer;
          display: block;
        }
      }
      input[type="text"] {
        margin-bottom: 10px;
        width: 100%;
        border: 1px solid $gray-light;
        padding-left: 15px;
        height: 38px;
        font-size: 14px;
        border-radius: 10px;
        -webkit-box-sizing: border-box;
      }
      
    }
  }
}
textarea.form-control {
        height: 150px !important;
      }
</style>

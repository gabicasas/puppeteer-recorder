<template>
  <div id="puppeteer-recorder" class="recorder">
    <div class="header">
      <a href="#" @click="goHome">
        Puppeteer recorder
        <span class="text-muted">
          <small>{{version}} PFC</small>
        </span>
      </a>
      <div class="left">
        <div class="recording-badge" v-show="isRecording">
          <span class="red-dot"></span>
          {{recordingBadgeText}}
        </div>
        <a href="#" @click="toggleShowHelp" class="header-button">
          <img src="/images/help.svg" alt="help" width="18px" />
        </a>
        <a href="#" @click="openOptions" class="header-button">
          <img src="/images/settings.svg" alt="settings" width="18px" />
        </a>
      </div>
    </div>
    <div class="main">
       <b-form @submit.stop.prevent="executeCode">
      <div class="tabs" v-show="!showHelp">
        <RecordingTab
          :code="code"
          :is-recording="isRecording"
          :live-events="liveEvents"
          v-show="!showResultsTab"
        />
        <div class="recording-footer" v-show="!showResultsTab">
          <button
            class="btn btn-sm"
            @click="toggleRecord"
            :class="isRecording ? 'btn-danger' : 'btn-primary'"
          >{{recordButtonText}}</button>
          <button
            class="btn btn-sm btn-primary btn-outline-primary"
            @click="togglePause"
            v-show="isRecording"
          >{{pauseButtonText}}</button>
         
          <a href="#" @click="showResultsTab = true" v-show="code">view code</a>
        </div>
        <ResultsTab
          :code="code"
          :copy-link-text="copyLinkText"
          :restart="restart"
          :set-copying="setCopying"
          v-show="showResultsTab"
        />
        <div class="results-footer" v-show="showResultsTab">
          <button class="btn btn-sm btn-primary" @click="restart" v-show="code">Restart</button>
          <b-form-input 
          v-model="filename"
          
          ></b-form-input>
         
          <b-button variant="primary" @click="executeCode" v-show="code">Ejecutar codigo</b-button>
          <a href="#" v-clipboard:copy="code" @click="setCopying" v-show="code">{{copyLinkText}}</a>
         
         
        </div>
      </div>
       </b-form>
      <HelpTab v-show="showHelp"></HelpTab>
    </div>
  </div>
</template>

<script>
import { version } from "../../../package.json";
import CodeGenerator from "../../code-generator/CodeGenerator";
import RecordingTab from "./RecordingTab.vue";
import ResultsTab from "./ResultsTab.vue";
import HelpTab from "./HelpTab.vue";
import Bridge from 'crx-bridge';
import EventBus from '../index.js';




export default {
  name: "App",
  components: { ResultsTab, RecordingTab, HelpTab },
  
  data() {
    return {
      code: "",
      showResultsTab: false,
      showHelp: false,
      liveEvents: [],
      recording: [],
      isRecording: false,
      isPaused: false,
      isCopying: false,
      bus: null,
      filename:"",
      version
    };
  },
 
  mounted() {

 EventBus.$on('reloadLiveEvents',  (message) => {
      console.log("reloadLiveEvents")
     this.liveEvents=message;
     
    })

  Bridge.onMessage('do-stuff', async (message) => {
      console.debug(message);
      if(this.liveEvents &&  this.liveEvents[0] && this.liveEvents[0].control)
        this.$chrome.storage.local.get(["recording"],({recording})=> 
        {
         
          this.liveEvents=recording
          
          })
      //this.reload();
      this.liveEvents.push(message.data)
     
    }) 
    
   Bridge.onMessage('changeSelector', async (message) => {
      // debugger
      console.debug(message);
       this.liveEvents[message.data.index]=message.data.event;
       //TODO: chapuza, solucionar esto del fallo de tener q añadir pq vue no se entera
      this.liveEvents.push(message.data.event)
      this.liveEvents.splice(this.liveEvents.length-1,1);
     
    })  

    this.loadState(this.reload);
   
    // Esto obtiene el bus que perite los postMessage
    this.bus = this.$chrome.extension.connect({ name: "recordControls" });

     
  },
  methods: {
   

    toggleRecord() {
      if (this.isRecording) {
        this.stop();
      } else {
        this.start();
      }
      this.isRecording = !this.isRecording;
      this.storeState();
    },
    togglePause() {
      if (this.isPaused) {
        this.bus.postMessage({ action: "unpause" });
        this.isPaused = false;
      } else {
        this.bus.postMessage({ action: "pause" });
        this.isPaused = true;
      }
      this.storeState();
    },
    start() {
      this.cleanUp();
      console.debug("start recorder");
      this.bus.postMessage({ action: "start" });
    },
    stop() {
      console.debug("stop recorder");
      this.bus.postMessage({ action: "stop" });

      this.$chrome.storage.local.get(
        ["recording", "options"],
        ({ recording, options }) => {
          console.debug("loaded recording", recording);
          console.debug("loaded options", options);
          this.recording = recording;
          const codeOptions = options ? options.code : {};

          const codeGen = new CodeGenerator(codeOptions);

        
          console.log(this.liveEvents);
          console.log(this.recording);
          // this.code = codeGen.generate(this.recording)
          this.code = codeGen.generate(this.liveEvents);
          this.showResultsTab = true;
          this.storeState();
        }
      );
    },
    restart() {
      console.log("restart");
      this.cleanUp();
      this.bus.postMessage({ action: "cleanUp" });
    },
    cleanUp() {
      this.recording = this.liveEvents = [];
      this.code = "";
      this.showResultsTab = this.isRecording = this.isPaused = false;
      this.storeState();
    },
    executeCode(){
       
      this.$http.post('http://localhost:8124',{
                   filename: 'gabi.js',
                   functionName: 'gabi',
                   code: this.code
                }).then(response => {

    console.debug(response);
                    alert(response.data);
  }, error => {
     alert("Falla la peticion");
                    console.debug(error);

  });
    
    },
    openOptions() {
      if (this.$chrome.runtime.openOptionsPage) {
        this.$chrome.runtime.openOptionsPage();
      }
    },
    reload(){
  /* this.$chrome.storage.local.onChanged((changed, areaName) => {
      debugger;
    }); */

      if (this.isRecording) {
        console.debug("opened in recording state, fetching recording events");
        //setInterval(() =>
        {this.$chrome.storage.local.get(
          ["recording", "code"],
          ({ recording }) => {
            console.debug("loaded recording", recording);
            this.liveEvents = recording;
          }
        );}//,1000);
      }

      if (!this.isRecording && this.code) {
        this.showResultsTab = true;
      }
    },
    loadState(cb) {
      this.$chrome.storage.local.get(
        ["controls", "code"],
        ({ controls, code }) => {
          console.debug("loaded controls", controls);
          if (controls) {
            this.isRecording = controls.isRecording;
            this.isPaused = controls._isPaused;
          }

          if (code) {
            this.code = code;
          }
          cb();
        }
      );
    },
    storeState() {
      this.$chrome.storage.local.set({
        code: this.code,
        controls: {
          isRecording: this.isRecording,
          isPaused: this.isPaused
        }
      });
    },
    setCopying() {
      this.isCopying = true;
      setTimeout(() => {
        this.isCopying = false;
      }, 1500);
    },
    goHome() {
      this.showResultsTab = false;
      this.showHelp = false;
    },
    toggleShowHelp() {
      this.showHelp = !this.showHelp;
    }
  },
  computed: {
    recordingBadgeText() {
      return this.isPaused ? "paused" : "recording";
    },
    recordButtonText() {
      return this.isRecording ? "Stop" : "Record";
    },
    pauseButtonText() {
      return this.isPaused ? "Resume" : "Pause";
    },
    copyLinkText() {
      return this.isCopying ? "copied!" : "copy to clipboard";
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~styles/_animations.scss";
@import "~styles/_variables.scss";
@import "~styles/_mixins.scss";

.recorder {
  font-size: 14px;

  .header {
    @include header();

    a {
      color: $gray-dark;
    }

    .left {
      margin-left: auto;
      display: flex;
      justify-content: flex-start;
      align-items: center;

      .recording-badge {
        color: $brand-danger;
        .red-dot {
          height: 9px;
          width: 9px;
          background-color: $brand-danger;
          border-radius: 50%;
          display: inline-block;
          margin-right: 0.4rem;
          vertical-align: middle;
          position: relative;
        }
      }

      .header-button {
        margin-left: $spacer;
        img {
          vertical-align: middle;
        }
      }
    }
  }

  .recording-footer {
    @include footer();
  }
  .results-footer {
    @include footer();
  }
}
</style>

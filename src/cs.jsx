/* CS is here to manage the presence of components and events they're not supposed to access.

Layout:
x Process messages from BG

x Create Sidebar
- Inject Sidebar into twitter pages when appropriate
  x home
  - compose
- Remove Sidebar from twitter pages when appropriate
  x home
  x compose

- manage information about twitter use (inited in initLocalStorage)
  x last_tweet_id // the last tweet whose page we were in
  x current_reply_to // could be last_tweet_id, but could be a direct reply outside of a tweet page
- manage inputs in twitter use
  x tweet, 
  x reply, 
  x rt, 
  x undo rt, 
  x delete

x define destruction and dispatch its event on start up
*/

import "@babel/polyfill";
import { h, render, Component } from 'preact';
// import { useState, useCallback } from 'preact/hooks';
import { updateTheme, getMode, isSidebar, getIdFromUrl, getCurrentUrl } from './utils/wutils.jsx'
import { getData, setData, msgBG, makeGotMsgObs, makeStoragegObs, inspect, requestRoboTweet } from './utils/dutils.jsx';
import { makeRoboStream, makeActionStream, makeComposeFocusObs, makeReplyObs, replyToWhom } from './ui/inputsHandler.jsx'
import { makeSidebarHome, makeSidebarCompose, makeHomeSidebarObserver, makeFloatSidebarObserver, injectSidebarHome, injectDummy } from './ui/sidebarHandler.jsx'
import { makeComposeObs } from './ui/composeHandler.jsx'

import { makeLastStatusObs, makeModeObs, makeBgColorObs } from './ui/tabsHandler.jsx'
import css from '../style/cs.scss'
import Kefir from 'kefir';
import { isNil, isEmpty, defaultTo, curry, filter, includes, difference, prop, props, path, propEq, pathEq, pipe, andThen, map, reduce, and, not, propSatisfies } from 'ramda'

import ThreadHelper from './components/ThreadHelper.jsx'


Kefir.Property.prototype.currentValue = function() {
  var result;
  var save = function(x) {
    result = x;
  };
  this.onValue(save);
  this.offValue(save);
  return result;
};


let thBarHome = makeSidebarHome()
let thBarComp = makeSidebarCompose()
const _onLoad = () => onLoad(thBarHome, thBarComp)
function main(){
  // Create Sidebar
  

  // Process messages from BG
  // Includes:
  // - Tab URL Change
  // chrome.runtime.onMessage.addListener(onMessage);  
  // chrome.storage.onChanged.addListener(onStorageChanged);
  window.addEventListener('load', _onLoad, true);
  
  msgBG({type:"cs-created"})
  
}

// hande twitter posting actions like tweets, rts and deletes
function handlePosting(){
  // msgBG({type:'query', query_type:'update'})
  msgBG({type:'update-tweets'})
}

const subscriptions = []

function rememberSub(sub){
  subscriptions.push(sub)
}
async function onLoad(thBarHome, thBarComp){
  const gotMsg$ = makeGotMsgObs().map(x=>x.m)
  const storageChange$ = makeStoragegObs()
  const sync$ = storageChange$.filter(x=>x.itemName=='sync').map(prop('newVal'))
  //TODO init val from stg
  const syncDisplay$ = storageChange$.filter(x=>x.itemName=='syncDisplay').map(prop('newVal')).toProperty(()=>'')
  syncDisplay$.log('syncDisplay')

  const mode$ = gotMsg$.filter(m => m.type == "tab-change-url").map(m=>getMode(m.url))
  
  const actions$ = makeActionStream()
  console.log('action stream created',actions$)
  const _sub_actions = actions$.observe({
    value(value) {
      console.log(`action taken: ${value}`)
      handlePosting()
    },
    error(error) {
      console.log('error:', error);
    },
    end() {
      console.log('end');
    },
  });
  rememberSub(_sub_actions)

  const bgColor$ = makeBgColorObs()
  const getBgColor = x=>x.style.backgroundColor
  const theme$ = bgColor$.map(getBgColor).skipDuplicates().toProperty(()=>getBgColor(document.body))
  const _sub_theme = theme$.observe({
    value(value) {
      updateTheme(value)
    },
    error(error) {
      console.log('error:', error);
    },
    end() {
      console.log('end');
    },
  })
  rememberSub(_sub_theme)

  // stream for focus on compose box
  // stream writing while focused 
  const composeFocus$ = makeComposeFocusObs();
  // composeFocus$.log('compose focus')
  const composeQuery$ = composeFocus$.filter(x => x != 'unfocused').flatMapLatest(e=>makeComposeObs(e.target)).toProperty(()=>'')
  
  // to detect when writing has stopped for a bit
  const stoppedWriting$ = composeQuery$.skipDuplicates().filter(x=>!isEmpty(x)).debounce(3000)
  stoppedWriting$.log("stoppedWriting")

  
  const lastStatus$ = makeLastStatusObs(mode$)
    lastStatus$.log("last status: ")
    
  const reply$ = makeReplyObs(mode$)
  
  const replyTo$ = reply$.map(replyToWhom(lastStatus$)).toProperty(()=>null)
    replyTo$.log("replying to ")
    
  const robo$ = Kefir.merge([makeRoboStream(), stoppedWriting$])
  robo$.onValue(_=>requestRoboTweet(composeQuery$.currentValue(), replyTo$.currentValue()))
  
  const thStreams = {
    actions : actions$,
    robo : robo$,
    composeQuery : composeQuery$,
    replyTo : replyTo$,
    syncDisplay : syncDisplay$,
  }
  //
  const activateSidebar = curry( (floatSidebarStream, inject, bar, thStreams) => { inject(bar); render(<ThreadHelper streams={thStreams} float={floatSidebarStream}></ThreadHelper>, bar); })
  // const activateFloatSidebar = curry( (inject, bar, thStreams) => { inject(bar); render(<ThreadHelper streams={thStreams}></ThreadHelper>, bar); })
  const activateFloatSidebar = activateSidebar(Kefir.never())
  const activateHomeSidebar = activateSidebar
  const deactivateSidebar = (bar) => { render(null, bar) }
  
  // for floating sidebar in compose mode
  const floatSidebar$ = makeFloatSidebarObserver(thBarComp)
  const _sub_float = floatSidebar$.observe({
    value(value) {
      console.log('float sidebar value:', value);
      value == 'render' ? activateFloatSidebar(injectDummy, thBarComp, thStreams) : deactivateSidebar(thBarComp)
    },
    error(error) {
      console.log('error:', error);
    },
    end() {
      console.log('end');
    },
  });
  // for main site sidebar over recent trends
  const homeSidebar$ = makeHomeSidebarObserver(thBarHome)
  const _sub_home = homeSidebar$.observe({
    value(value) {
      // console.log('home sidebar value:', value);
      value == 'render' ? activateHomeSidebar(floatSidebar$, injectSidebarHome, thBarHome, thStreams) : deactivateSidebar(thBarHome)
    },
    error(error) {
      console.log('error:', error);
    },
    end() {
      console.log('end');
    },
  });

  // for destructing
  rememberSub(_sub_float)
  rememberSub(_sub_home)

  // setUpTrendsListener(thBarHome, inputStreams)
  // setUpFloatingComposeListener(thBarComp, inputStreams)
  // setUpComposeListener()
  // setUpPublishListeners()

  if(!await getData('sync')){
    // msgBG({type:"query", query_type: "update"})
    msgBG({type:"update-tweets"})
    
  }
}

  
function destructor(destructionEvent) {
  // Destruction is needed only once
  document.removeEventListener(destructionEvent, destructor);
  // Tear down content script: Unbind events, clear timers, restore DOM, etc.
  // document.removeEventListener('focusin',wutils.onFocusIn);
  // document.removeEventListener('focusout',wutils.onFocusOut);
  window.removeEventListener('load', _onLoad, true);
  // chrome.runtime.onMessage.removeListener(onMessage);
  // chrome.storage.onChanged.removeListener(onStorageChanged);
  // for (let obs of wutils.observers){
  //   if (obs != null) obs.disconnect()
  // }
  subscriptions.forEach(x=>x.unsubscribe())
  render(null,thBarHome)
  render(null,thBarComp)
  //console.log("DESTROYED")
  //chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => chrome.tabs.reload(tabId));
}

function setDestruction(destructor){
  const destructionEvent = 'destructmyextension_' + chrome.runtime.id;
  // Unload previous content script if needed
  document.dispatchEvent(new CustomEvent(destructionEvent));
  const _destructor = ()=> destructor(destructionEvent)
  document.addEventListener(destructionEvent, _destructor);
  
  
  //let port = chrome.runtime.connect()
  //port.onDisconnect.addListener(destructor)

}

//destroys previous content script
setDestruction(destructor);

main()
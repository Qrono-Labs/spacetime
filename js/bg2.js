"use strict";

// let idb = require('idb')
// window.idb = require('idb')

// Utilities for interacting with storage, meta data, process headers, and act on install
class Utils {
  constructor() {
    this.db = {}
    this.openDB()
    this._options = {getRetweets: true, getArchive: false}
    this.loadOptions()
    this._tabId = null
    this.twitter_url = /https?:\/\/(www\.)?twitter.com\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  }

  async openDB(){
    console.log("OPENING DB")
    const db = await idb.openDB('ThreadHelper', 1, {
      upgrade(db) {
        console.log("version ",db.oldVersion)
        let oldV = db.oldVersion != null ? db.oldVersion : 0
        switch (oldV) {
          case 0:
            // Create a store of objects
            const store = db.createObjectStore('tweets', {
              // The 'id' property of the object will be the key.
              keyPath: 'id',
              // If it isn't explicitly set, create a value by auto incrementing.
              // autoIncrement: true,
            });
            const misc = db.createObjectStore('misc', {
              // The 'id' property of the object will be the key.
              // keyPath: 'key',
              // If it isn't explicitly set, create a value by auto incrementing.
              // autoIncrement: true,
            });
            // Create an index on the 'date' property of the objects.
            store.createIndex('time', 'time');
            // a placeholder case so that the switch block will
            // execute when the database is first created
            // (oldVersion is 0)
            break;
          default:
            break;
          }
      },
    });
    this.db = db
    return db
  }
  
  
  get tabId(){return this._tabId}
  set tabId(tabId){
    this._tabId = tabId}
  
  get options(){return this._options}
  set options(options){
    if(this._options.getRetweets != options.getRetweets){
      console.log("option getRetweets changed", options.getRetweets)
      wiz.getLatestTweets().then((latest)=>{
        wiz.latest_tweets = latest
        utils.msgCS({type:"toggled-retweets"})
      })

    }
    this._options = Object.assign(this._options,options)
  }
  

  onTabActivated(activeInfo){
    chrome.tabs.get(activeInfo.tabId, function(tab){
      //console.log("tab", tab)
      try{
        let url = tab.url;
        if (url.match(utils.twitter_url)) {
          utils.tabId = tab.id
          utils.msgCS({type:"tab-activate", url:url, cs_id: tab.id})
        }
      }catch(e){
        console.log(e)
      }
    });
  }
  
  onTabUpdated(tabId, change, tab){
    if (tab.active && change.url) {
      if (change.url.match(utils.twitter_url)){
        utils.tabId = tab.id
        utils.msgCS({type:"tab-change-url", url:change.url, cs_id: tab.id})
      }
    }
  }    

//   async updateDB(storeName, key_vals){
//     if(storeName == "tweets" || storeName == "staged_tweets"){
//         let storeName = storeName;      
//         const tx = this.db.transaction(storeName, 'readwrite');
//         const store = tx.objectStore('tweets');
//         let value = await this.db.get(storeName, storeName);
//         value = value != null ? value : {}
//         Object.assign(value,key_vals)
//         await store.put(value);
//         await tx.done;
//       }  
//   }

  //gets data and changes its attributes that match key_vals, then sets it
  async updateData(key, key_vals){
    let objset = {}
    this.getData(key).then(val=>{
      if (val !=null){
        val = Object.assign(val,key_vals)
        objset[key] = val
      } else{
        objset[key] = key_vals
      }
      this.setData(objset)
    })
  }

  async getDB(key, storeName = 'tweets'){
    return this.db.get(storeName, key);
  }

  //returns a promise that gets a value from chrome local storage 
  async getData(key) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(key, function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          // console.log(items[key])
          resolve(items[key]);
        }
      });
    });
  }
  
  // list as input
  // used only to add tweets to the store
  async putDB(item_list, storeName = 'tweets'){
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    let promises = []
    try{
      for(let item of item_list){
        store.put(item)
      }
      promises.push(tx.done)
      return await Promise.all(promises)        
    } catch(e){
      console.log(promises)
      throw(e)
    }
  }

  //returns a promise that sets an object with key value pairs into chrome local storage 
  async setData(key_vals) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.set(key_vals, function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          resolve();
          // if(Object.keys(key_vals).includes('search_results'))console.log(key_vals)
        }
      });
    });
  }

  // Delete data from storage
  // takes an array of keys
  async removeData(keys){
    return new Promise(function(resolve, reject) {
      chrome.storage.local.remove(keys,function(){
        //console.log("removed", keys)
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          resolve();
        }
      }); 
    });
  }

      
  async clearDB(){
    let storeName = "tweets"
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    await tx.done;
  }
  //clears storage of tweets, tweets meta info, and auth
  async clearStorage(){
    utils.db.clear('tweets')
    this.removeData(["tweets","tweets_meta","latest_tweets","search_results","index","has_timeline","has_archive","sync"]).then(()=>{
        this.msgCS({type: "storage-clear"}) 
        wiz.tweets_meta = wiz.makeTweetsMeta(null)
      }
    )
    return true
  }

  // gets all twitter tabs
  getTwitterTabIds(){
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({url: "*://twitter.com/*", currentWindow: true}, function(tabs){
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          //console.log("twitter tabs",tabs)
          let tids = tabs.map(tab=>{return tab.id})
          resolve(tids);
        }
      });  
    });
  }

  // Gets the ID of the current tab
  getActiveTabId(){
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          //console.log(tabs)
          resolve(tabs[0].id);
        }
      });  
    });
  }

  // Loads options from storage
  async loadOptions(){
    this.getData("options").then(opts=>{
      this.options = opts != null ? opts : this.options
    })
  }


  // Message content script  
  async msgCS(m){
    //let tabId = await utils.getTabId()
    try{
    chrome.tabs.sendMessage(this.tabId, m)
    // console.log("sending message to cs tab ", m)
    } catch(e){
    //console.log(e)
    }
  }

  // called every time headers are sent, if they contain the auth, take it and update our auth
  async processHeaders(headers){
    let csrfToken = null
    let authorization = null
    for (let header of headers) {
      if (header.name.toLowerCase() == "x-csrf-token") {
        csrfToken = header.value;
      } else if (header.name.toLowerCase() == "authorization") {
        authorization = header.value;
      }
    }
    if (csrfToken && authorization && csrfToken != "null" && authorization != "null"){
      // console.log(headers)
      auth.updateAuth(csrfToken,authorization)
    }
    else{
      //console.log("header does not have auth")
    }
  }

  onInstalled() {
    //console.log("On Installed!")
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([
        {
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { urlContains: "twitter.com" }
            })
          ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
        }
      ]);
    });
    //
    utils.getTwitterTabIds().then(tids=>{
      //console.log("reloading twitter tabs", tids)
      for (let tid of tids){
        chrome.tabs.reload(tid);
      }
    })
  }

    
  // to format YYYY-MM-DD
  formatDate(d = null){
    d = d == null ? new Date() : d;
    return `${''+d.getFullYear()}-${(''+(d.getMonth()+1)).padStart(2,0)}-${(''+d.getDate()).padStart(2,0)}`
  }

}


/*
testAuth: checks if it's null, makes a request about current user
getAuth: load or reload page
updateAuth: turns headers into auth
*/
class Auth {
  constructor(csrfToken = null, authorization = null, since = null) {
    this.csrfToken = csrfToken;
    this.authorization = authorization;
    this.since = since
    
  }
  
  isAuth(){
    let auth = this;
    return ! (typeof auth === 'undefined' || auth.authorization == null || auth.csrfToken == null || auth.authorization == 'null' ||auth.csrfToken == 'null')
  }
  // is auth something rather than null and friend?
  isFresh(stale_thresh=1){
    // auths aren't explicitly expired, but I still don't exactly know what to do when the current one is bad and reloading doesn't get you a new one
    let auth = this;
    let fresh = false;
    if (!auth.isAuth()){
      //console.log("auth does not exist", auth)
      return false
    }
    else{ 
      var now = new Date()
      var msPerH = 60 * 60 * 1000; // Number of milliseconds per day
      //var stale_thresh = 0.05 //3m
      var hours_past = (now.getTime() - auth.since) / msPerH;
      if(hours_past <= stale_thresh) {
        fresh = true
      }
    }
    return fresh
  }
  //make a trivial request to make sure auth works
  //returns false if not good, and user info if good
  async testAuth(){
    let auth = this;
    let _user_info = null;
    if (this.isAuth()){
      try
      {
        const init = {
          credentials: "include",
          headers: {
            authorization: auth.authorization,
            "x-csrf-token": auth.csrfToken
          }
        };
        var uurl = `https://api.twitter.com/1.1/account/verify_credentials.json`
        //console.log("testing auth getting user info")
        let res = await fetch(uurl,init).then(x => x.json())//.catch(throw new Error("caught in fetch")) 
        if(!Object.keys(res).includes("errors"))
        {
          utils.setData({user_info: res})
          wiz.user_info = res
          _user_info = res
          //console.log("auth is good")
        } else{
          _user_info = null
        }
      }
      catch(err){
        console.log(res)
        _user_info = null
          //console.log("auth is stale")
          //console.log(err)
      }
    }
    return _user_info
  }

  setParams(auth){
    this.csrfToken = auth.csrfToken;
    this.authorization = auth.authorization;
    this.since = auth.since
  }

  getParams(){
    return {csrfToken: this.csrfToken, authorization: this.authorization, since: this.since}
  }


  // check if good, tries to load, and reloads page if failed (to get an auth)
  // auths are produced when application cookie isn't there
  // reload will only work if cookie's missing
  // 
  async getAuth() {
    //try to get from storage first
    let success = false
    let auth = this
    let fresh = false
    fresh = await auth.testAuth()
    // test if it's already a good auth
    if (fresh){      success = true    }
    // otherwise try to load from storage and test if it's good
    else{
      let data = await utils.getData("auth");
      if (data != null && data.csrfToken != null && data.authorization != null) auth.setParams(data)

      if (await auth.testAuth()){
        success = true
      }
      // if it's not good, delete it from storage
      else{
        //console.log("couldn't or is bad, getting new auth")
        chrome.storage.local.remove(["auth"],function(){
          var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
          //console.log("deleted stored auth")
        })
        //chrome.cookies.remove("auth_token")
        //chrome.cookies.getAll({domain: "twitter.com"/*, name:"auth"*/}, (r)=>{console.log("cookies",r)})
        success = false
        //finally reload page to get a new one
        this.getNew();
      }
    }
    return success
  }

  // tries to reload page to get a new auth
  async getNew(){
    var reload_ok = confirm("I'll have to reload the page to get my authorization token :)");
    if (reload_ok){
      chrome.tabs.reload(utils.tabId);
    }
  }

  // Gets auth and csrf token Called before every request. Store only if expired.
  async updateAuth(csrfToken, authorization) {
    let auth_params = {}

    // gather auth params
    auth_params.csrfToken = csrfToken;
    auth_params.authorization = authorization;
    var now = new Date()
    auth_params.since = now.getTime()

    // set em
    this.setParams(auth_params)
    utils.setData({ auth: auth_params})
  }

}


// For all functions related to getting tweets
class TweetWiz{
    constructor() {
      this._inited = false
			//request flow
      this._midRequest = false
			this.interrupt_query = false
			
			//DB data
      this.tweets_dict = {}
      this.tweet_ids = []
      this.users = {}
			
			//localStorage boys
      this._user_info = {}
			this._tweets_meta = this.makeTweetsMeta(null)
			this._has_archive = false
			this._has_timeline = false
			this._sync = false
			// this._search_results= []
      this._latest_tweets = []

			//profile pics
      this.user_queue = [] // user ids to be scraped
      this.pic_tweet_queue = {} //tweet_id: user_id 
      this.profile_pics = {} //id: {"name" "screen_name" "id_str"}
    }
    
    init(){
      Promise.all(
      [
      utils.db.getAllKeys('tweets').then((ids)=>{this.tweet_ids = this.sortKeys(ids)}),
      utils.getData("user_info").then((info)=>{this.user_info = info != null ? info : {}}),
      utils.getData("has_archive").then((info)=>{this.has_archive = info != null ? info : false}),
      utils.getData("has_timeline").then((info)=>{this.has_timeline = info != null ? info : false}),
      utils.getData("tweets_meta").then((meta)=>{this.tweets_meta = meta != null ? meta : this.makeTweetsMeta(null)}),
      // utils.getData("tweets").then((tweets)=>{this.tweets_dict = tweets != null ? tweets : {}}),
      utils.getData("latest_tweets").then((latest_tweets)=>{this._latest_tweets = latest_tweets != null ? latest_tweets : [];})
      ]).then(
        ()=>{
          console.log("after wiz init")
          wiz.inited = true
        }
      )
		}
		  
    
    get user_info(){return this._user_info}
    // set the value of our user  info, and if it's new, set it in storage
    set user_info(user_info){
      if (user_info != this._user_info)
        this._user_info = user_info
        utils.setData({user_info:this._user_info})
		}
		get has_archive(){return this._has_archive}
    // set the value of our user  info, and if it's new, set it in storage
    set has_archive(has_archive){
      if (has_archive != this._has_archive)
        this._has_archive = has_archive
        utils.setData({has_archive:this._has_archive})
		}
		get has_timeline(){return this._has_timeline}
    // set the value of our user  info, and if it's new, set it in storage
    set has_timeline(has_timeline){
      if (has_timeline != this._has_timeline)
        this._has_timeline = has_timeline
        this.updateSync()
        utils.setData({has_timeline:this._has_timeline})
    }
    get inited(){return this._inited}
    // set the value of our user  info, and if it's new, set it in storage
    set inited(inited){
      this._inited = inited
      this.updateSync()
    }
    get midRequest(){return this._midRequest}
    // set the value of our user  info, and if it's new, set it in storage
    set midRequest(mid){
      this._midRequest = mid
      this.updateSync()
		}
		get sync(){return this._sync}
    // set the value of our user  info, and if it's new, set it in storage
    set sync(sync){
      if (sync != this._sync){
        this._sync = sync
        utils.setData({sync:this._sync})
      }
    }
    updateSync(){
      this.sync = wiz.inited && nlp.inited && !this.midRequest && this.has_timeline && nlp.index != null
      console.trace("updating sync to ", this.sync)
    }

    get tweets_meta(){return this._tweets_meta}
    set tweets_meta(tweets_meta){
      this._tweets_meta = tweets_meta
      utils.setData({tweets_meta:this.tweets_meta}).then(()=>{
      })
    }
    get latest_tweets(){return this._latest_tweets}
    set latest_tweets(latest_tweets){
      this._latest_tweets = latest_tweets
      utils.setData({latest_tweets:this.latest_tweets}).then(()=>{
      })
    }



    async setNewTweets(new_tweets){
      console.log("setting new tweets ", new_tweets)
      if(new_tweets != null){
        if(new_tweets.length <= 0) return
        console.time(`updateIndex`)
        nlp.updateIndex(new_tweets)
        console.timeEnd(`updateIndex`)
        console.time(`putDB`)
        await utils.putDB(Object.values(new_tweets))
        console.timeEnd(`putDB`)
        console.time(`sort and getallkeys`)
        let keys = await utils.db.getAllKeys('tweets')
        this.tweet_ids = this.sortKeys(keys)
        this.tweets_meta = this.updateMeta(new_tweets)
        this.latest_tweets = await this.getLatestTweets()
        console.timeEnd(`sort and getallkeys`)
      }
    }
  
    async loadUserInfo(){
      utils.getData("user_info").then((info)=>{this.user_info = info})
      return this.user_info
    }

    async getLatestTweets(n_tweets = 20){
      // let keys = utils.db.getAllKeys('tweets')
      let keys = this.tweet_ids
      let latest = []

      for (let k of keys){
        let t = await utils.getDB(k)
        if(utils.options.getRetweets){
          latest.push(t)
        } else{
          if(t.username == this.user_info.screen_name) latest.push(t)
        }
        if(latest.length >= n_tweets) break;
      }
      // let latest = (keys.slice(0, n_tweets).map(k=>{return await utils.getDB(k)}))
      return latest
    }

    updateMeta(new_tweets){
      let old_meta = this.tweets_meta
      let len = Object.keys(new_tweets).length - 1
      let first_key = Object.keys(new_tweets)[0]
      let last_key = Object.keys(new_tweets)[len]
      let meta = {
        count: this.tweet_ids.length, 
        max_id: Math.min(new_tweets[last_key].id, old_meta.max_id),
        max_time: Math.min(new_tweets[last_key].time, old_meta.max_time),
        since_id: Math.max(new_tweets[first_key].id, old_meta.since_id),
        since_time: Math.max(new_tweets[first_key].time, old_meta.since_time),
        last_updated: (new Date()).getTime(),
      }
      return meta
    }
  
    makeTweetsMeta(tweets){
      let meta = {}
      if (tweets != null){
        if (Object.keys(tweets).length>0){
          let len = Object.keys(tweets).length - 1
          let first_key = Object.keys(tweets)[0]
          let last_key = Object.keys(tweets)[len]
          meta = {
            count: len, 
            max_id: tweets[last_key].id, 
            max_time: tweets[last_key].time,
            since_id: tweets[first_key].id, 
            since_time: tweets[first_key].time,
            last_updated: (new Date()).getTime(),
          }
        }
      } else{
        meta = {
          count: 0, 
          max_id: null, 
          max_time: null,
          since_id: null, 
          since_time: null,
          last_updated: null,
        }
      }
      return meta
    }
  
      
    // TODO: maximal efficiency would consider the origin with the old tweets but that's more than I want to do
    joinTweets(_old, _new, query_type = "update"){
      let priority = {
        timeline: 5,
        update: 4, //there are reasons for update to be higher priority than timeline (deleted recent tweets) but like this is more efficient
        archive: 3,
        old: 2,
        history: 1
      }
      let new_tweets = []
      if (priority[query_type] > priority.old){
        new_tweets = Object.assign(_old, _new)
      } else{
        new_tweets = Object.assign(_new, _old)
      }
      if (query_type != "update") new_tweets = this.sortTweets(new_tweets)
  
      return new_tweets
    }

    sortKeys(keys){
      let comp = (b,a)=>{return a.localeCompare(b,undefined,{numeric: true})}
      return keys.sort(comp)
    }
  
    // newest (largest id) first
    sortTweets(tweetDict){
      let keys = Object.keys(tweetDict)
      let skeys = this.sortKeys(keys)
      let stobj = Object.fromEntries(skeys.map((k)=>{return[k,tweetDict[k]]}))
      return stobj
    }
  
    // gets the difference between old and new in dict form
    getNewTweets(old_t,new_t){
      //console.log("getnewtweets")
      let old_keys = old_t != null ? Object.keys(old_t) : []
      let new_key_vals = Object.entries(new_t)
      const _filtered = Object.fromEntries(
        new_key_vals.filter(key_val => {return !old_keys.includes(key_val[0])})
      )
      return _filtered
    }
    // Convert request results to tweets and save them
    // TODO  : deal with archive RTs which are listed as by the retweeter and not by the original author
    async saveTweets(res, query_type = "update"){
      // In the case of an update query, check whether the most recent result is newer than our current set of tweets as 
      // If res is new 
      res = res.filter(r=>{return !this.tweet_ids.includes(r.id_str)})
      if (res.length < 1){
        console.log("canceled save", query_type)
        return {}
      } 
      console.time('toTweets')
      // Takes relatively little time
      // Mapping results to tweets
      let arch = query_type == "archive"
      let toTweet = (t)=>{let tweet = wiz.toTweet(t,false); return [tweet.id, tweet]}
      let archToTweet = (t)=>{let tweet = wiz.toTweet(t,true); return [tweet.id, tweet]}
      let new_tweet_list = arch ? res.map(archToTweet) : res.map(toTweet);
      let new_tweets = Object.fromEntries(new_tweet_list)
      let all_tweets = {}
      console.timeEnd('toTweets')
      
      // Update staging area with new tweets and tell CS to load
      console.time(`set new tweets ${Object.keys(new_tweets).length}`)
      this.setNewTweets(new_tweets)
      console.timeEnd(`set new tweets ${Object.keys(new_tweets).length}`)

      return new_tweets
    }
    // removes duplicate tweets
    removeDuplicates(myArr, prop ='id') {
      let unique_arr = myArr
      if(myArr != null) unique_arr = myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
      });
      return unique_arr
    }
    async getProfilePics(){
      console.log("getting profile pics")
      const init = {
        credentials: "include",
        headers: {
          authorization: auth.authorization,
          "x-csrf-token": auth.csrfToken
        }
      };
      // let url = (name)=>{return `https://api.twitter.com/1.1/users/show.json?user_id=${name}`}
      //takes comma-separated list of user_ids
      let url = (ids)=>{return `https://api.twitter.com/1.1/users/lookup.json?user_id=${ids}`}
      let pic = ''
      let obj = {}
      let res = {}
      let temp_users = {}
  
      this.user_queue = this.user_queue.filter(x=>{return x != '-1'})
      this.pic_tweet_queue = Object.fromEntries(Object.entries(this.pic_tweet_queue).filter(x=>{return x[1] != '-1'}))
      //split array into chunks
      var i,j,ids,temparray,chunk = 100;
      for (i=0,j=this.user_queue.length; i<j; i+=chunk) {
          temparray = this.user_queue.slice(i,i+chunk);
          ids = temparray.join(',')
          try{
            res = await fetch(url(ids),init).then(x => x.json())
          } catch(e){
            console.log(e)
            console.log("error looking users up", ids)
          }
          
          //Basically add new profile pics to the profile pic holder
          try{
            this.profile_pics = Object.assign(this.profile_pics, Object.fromEntries(res.map(u=>{return [u.id_str, u.profile_image_url_https]})))
          } catch(e){
            console.log(res)
            console.log(e)
            throw("ERROR GETTING PROFILE PICS")
          }
          this.users = Object.assign(this.users, Object.fromEntries(res.map(u=>{return [u.id_str, u]})))
          //console.log(pic)
          // do whatever
      }
      // Gets tweets from storage to add to them
      // For each tweet without pic (which is why its in the queue), assign it its user's profile pic
      // After storing again, delete the profile pics
      utils.getData("tweets").then((tweets)=>{
        for (let key_val of Object.entries(this.pic_tweet_queue)){
          // tweets[key_val[0]].profile_image = Object.keys(this.profile_pics).includes(key_val[1]) ? this.profile_pics[key_val[1]] : this.profile_pics[key_val[1]]
          tweets[key_val[0]].profile_image =  this.profile_pics[key_val[1]]
          tweets = this.sortTweets(tweets)
        }
        utils.setData({tweets:tweets}).then(()=>{
          this.profile_pics = {}
          this.user_queue = []
          this.pic_tweet_queue = {}
          console.log("done setting profile pics")
        })
      })
    }
    /*TH tweet template:
    tweet= {
      username,
      name,
      text,
      profile_image,
      retweeted
      time,
      reply_to,
      mentions,
      urls,
      has_media,
      media,
      has_quote,
      quote,
      is_quote_up,
      quote:
        text,
        name,
        username,
        time,
        profile_image,
        // Replies/mentions.
        reply_to,
        mentions,
        // URLs.
        urls,
        has_media,
        media,
    }
    */
    toTweet(entry, arch = false){
      let return_tweet = {}
      let tweet = {};
  
  
      entry = arch ? entry.tweet : entry;
      
      let re = /RT @([a-zA-Z0-9_]+).*/
      let rt_tag = /RT @([a-zA-Z0-9_]+:)/
      let default_pic_url = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'
      try{
        if (entry != null){
          tweet.id = entry.id_str
          //Handing retweets in archive
          if(arch){
            let rt = re.exec(entry.full_text);  
            //tweet contents
            tweet.username = rt != null ? rt[1] : wiz.user_info.screen_name
            tweet.text = rt != null ? entry.full_text.replace(rt_tag,'') : entry.full_text
            // If I'm tweeting/retweeting myself
            if(tweet.username == wiz.user_info.screen_name){
              tweet.name = wiz.user_info.name
              tweet.profile_image = wiz.user_info.profile_image_url_https
            } 
            // if I'm retweeting someone else
            else{
              tweet.profile_image = default_pic_url
              try{
                let author = entry.entities.user_mentions.find(t=>{return t.screen_name.toLowerCase() == tweet.username.toLowerCase()})
                tweet.name = author != null ? author.name : tweet.username
                wiz.user_queue.push(author.id_str)
                wiz.pic_tweet_queue[entry.id_str] = author.id_str
                tweet.retweeted = true
              } catch(e){
                console.log("ERRORRRRRRRR", e)
                console.log("RT match",rt)
                console.log("tweet username",tweet.username)
                console.log(entry.entities.user_mentions)
              }
              //console.log(tweet); console.log(entry); wiz
            }
          }else{
            tweet.retweeted = entry.retweeted
            tweet.id = entry.id_str
            if(tweet.retweeted){
              if(entry.retweeted_status != null) tweet.orig_id = entry.retweeted_status.id_str
               entry = entry.retweeted_status != null ? entry.retweeted_status : entry;
              }
            //tweet contents
            tweet.username = entry.user.screen_name
            tweet.name = entry.user.name
            tweet.text = entry.full_text || entry.text
            tweet.profile_image = entry.user.profile_image_url_https
            
          }
            // Basic info, same for everyone
            // tweet.id = entry.id,
            tweet.time = new Date(entry.created_at).getTime()
            // tweet.human_time = new Date(entry.created_at).toLocaleString()
            // Replies/mentions.
            tweet.reply_to = entry.in_reply_to_screen_name != null ? entry.in_reply_to_screen_name : null // null if not present.
            tweet.mentions = entry.entities.user_mentions.map(x => ({username: x.screen_name, indices: x.indices}))
            // URLs.
            tweet.urls = entry.entities.urls.map(x => ({current_text: x.url, display: x.display_url, expanded: x.expanded_url}))
            // Media.
            tweet.has_media = typeof entry.entities.media !== "undefined"
            tweet.media = null
            // Quote info.
            tweet.has_quote = entry.is_quote_status
            tweet.is_quote_up = typeof entry.quoted_status !== "undefined"
            tweet.quote = null
          // Add media info.
          if (tweet.has_media) {
            tweet.media = entry.entities.media.map(x => ({current_text: x.url, url: x.media_url_https}))
          }
          // Add full quote info.
          if (tweet.has_quote && tweet.is_quote_up) {
            tweet.quote = {
              // Basic info.
              text: entry.quoted_status.text,
              name: entry.quoted_status.user.name,
              username: entry.quoted_status.user.screen_name,
              time: new Date(entry.quoted_status.created_at).getTime(),
              profile_image: entry.quoted_status.user.profile_image_url_https,
              // Replies/mentions.
              reply_to: entry.quoted_status.in_reply_to_screen_name,
              mentions: entry.quoted_status.entities.user_mentions.map(x => ({username: x.screen_name, indices: x.indices})),
              // URLs.
              urls: entry.quoted_status.entities.urls.map(x => ({current_text: x.url, display: x.display_url, expanded: x.expanded_url})),
              has_media: typeof entry.quoted_status.entities.media !== "undefined",
              media: null,
            }
            if (tweet.quote.has_media) {
              tweet.quote.media = entry.quoted_status.entities.media.map(x => ({current_text: x.url, url: x.media_url_https}))
            }
          }
        }
    } catch(e){
      console.log("error in totweet", e)
      console.log("error in totweet", entry)
      throw(e)
    }
      return tweet
    }
      
    // Catches errors and sometimes reloads the page to get a new auth
    handleError(err){
      //console.log("handling tweet query error")
      switch (err.code){
        case 353: //"This request requires a matching csrf cookie and header."
          //console.log("auth is bad, getting new")
          auth.getNew();
        case 215: //""Bad Authentication data.""
          //console.log("auth is bad, getting new")
          auth.getNew();
        default:
        }
      console.log(err)
    }

     
    //to call when we have tweets and wish to update just with the lates
    async query(auth, meta = null, query_type = "update", count = 3000) {
      console.time(`complete query`);
      //start by defining common variables
      this.interrupt_query = false
      // meta = meta != null ? meta : this.tweets_meta
      meta = this.tweets_meta
      let vars ={}
      let include_rts = true //utils.options.getRetweets != null ? utils.options.getRetweets : true//TODO investigate why these are coming up undefined
      const init = {
        credentials: "include",
        headers: {
          authorization: auth.authorization,
          "x-csrf-token": auth.csrfToken
        }
      };
      var username = this.user_info.screen_name
      var received_count = 0
      var users = []
      let res = []
      let url = ''
      let stop = false
  
      let new_tweets = {}
      
      // Container for a dynamic set of variables dependent on query_type
      
      // Defining functions for setup phase
      let setup ={
        update: (vars)=>{
          vars.since = meta.since_id != null ? `&since_id=${meta.since_id}` : ''
          vars.since_id = 0
          vars.url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}&count=${count}${vars.since}&include_rts=${include_rts}`
          vars.stop_condition = (res,received_count) => {return true ||received_count >= count || !(res != null) || res.length <= 1 || stop}
          return vars
        },
        timeline: (vars)=>{
          // vars.max = meta.max_id != null ? `&since_id=${meta.max_id}` : ''
          vars.max = meta.max_id != null ? `&max_id=${meta.max_id}` : ''
          vars.max_id = meta.max_id == null ? -1 : meta.max_id;
          vars.url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}${vars.max}&count=${count}&include_rts=${include_rts}`
          vars.stop_condition = (res,received_count) => {return received_count >= count || !(res != null) || res.length < 1 || stop}
          return vars
        },
        history: (vars)=>{
          vars.nDays = (n) =>{return n * 24 * 60 * 60 * 1000}
          vars.max_n_reqs = 180;      
          vars.arch_until = metautils.formatDate()
          vars.since = new Date(vars.arch_until);
          vars.arch_since = new Date(this.user_info.created_at);
          vars.until = new Date(vars.arch_until);
          vars.arch_until = vars.arch_until==null ? new Date() : new Date(vars.arch_until);
          
          // max days we can fit in 180 requests?
          // day span divided by 180 to know how many days to ask per request
          vars.nd = Math.min(5,Math.ceil(Math.floor((vars.arch_until.getTime() - vars.arch_since.getTime())/nDays(1)) / vars.max_n_reqs))
          vars.since.setTime(vars.since.getTime() - vars.nDays(nd))
          vars.stop_condition = (since, arch=arch_since) => {return (vars.since.getTime() <= vars.arch_since.getTime()) || this.interrupt_query }
          vars.query = escape(`from:${username} since:${utils.formatDate(vars.since)} until:${utils.formatDate(vars.until)}`);	  
          vars.url = `https://api.twitter.com/2/search/adaptive.json?q=${vars.query}&count=${count}&tweet_mode=extended`;
          return vars
        },
      }
  
      // Functions for Treat phase, treating the request respense
      let treat ={
        update: async (vars)=>{
          let batch_since = res[0].id
          if (vars.since_id < batch_since){
            vars.since_id = batch_since
          } else{
            stop = true
          }
          vars.url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}&count=${count}&since_id=${vars.since_id}&include_rts=${include_rts}`    
          return vars
        },
        timeline: async (vars)=>{
          let batch_max = res[res.length - 1].id
          if ((batch_max >= vars.max_id && vars.max_id != -1)){
            console.log("stopping timeline query", wiz._tweets_meta)
            stop = true
          }
          // max_id is the max of the next request, so if we received a lower id than max_id, use the new one 
          vars.max_id = (batch_max < vars.max_id || vars.max_id == -1) ? batch_max : vars.max_id
          vars.url = `https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${username}&count=${count}&max_id=${vars.max_id}&include_rts=${include_rts}`
          return vars
        },
        history: async (vars)=>{
          var res_tweets = Object.values(res.globalObjects.tweets)
          if (res_tweets.length == 0 || res_tweets == null){// console.log("res is empty or empty")
          }
          else
          {
            users = Object.values(res.globalObjects.users)
            let user_tweets = res_tweets.map(t=>{t.user=users.find(u=>{return u.id == t.user_id}); return t})
          }
          vars.until.setTime(vars.until.getTime() - vars.nDays(vars.nd)) 
          vars.since.setTime(vars.until.getTime() - vars.nDays(vars.nd)) 
          vars.url = `https://api.twitter.com/2/search/adaptive.json?q=${vars.query}&count=${count}&tweet_mode=extended`;
          return vars
        },
      }
  
      // Prep phase of query, defining variables, defining url for query
      vars = setup[query_type](vars)
      //console.log(vars)
      // Query loop
      do
      {
        try
        {
          console.log(`GET: ${vars.url}`)
            console.time(`request`);
            res = await fetch(vars.url,init).then(x => x.json())
            console.timeEnd(`request`);
          }
          catch(err){
            TweetWiz.handleError(err)
          }
          if (res.length <= 0 || res == null){
            //throw new Error("res is empty")
            //console.log("res is empty")
            break;
          } else{ 
            //modifies new_tweets
            try{
              console.time(`treat request`);
              received_count +=  res.length
              vars = await treat[query_type](vars)
              console.log(res)
              console.timeEnd(`treat request`);
            } catch(e){
              console.log(res)
              throw(e)
            }
            // console.log(res)
            console.time("out save tweets")
            // new_tweets = await wiz.saveTweets(res, query_type);
            wiz.saveTweets(res, query_type);
            console.timeEnd("out save tweets")
            // tweets = Object.assign(tweets,new_tweets)
            // console.log(`received total ${tweets.length} tweets`);
            // console.log("actual query results:", res);
          }
        }while(!vars.stop_condition(res,received_count))
      console.timeEnd(`complete query`);
      return 
    }
  
    /* Updates tweets in 4 different ways
    update: gets tweets from the most recent in storage to now
    timeline: gets all 3200 tweets from timeline
    history: searches every date since you created your account for your tweets
    archive: loads from local downloaded twitter archive
    */
    async handleQuery(query_type = "update"){
      query_type = query_type
      // let tweets = {}
      // let meta = {}
      // If mid request, stop now
      if (wiz.midRequest || !wiz.inited || !nlp.inited){ return }
      wiz.midRequest = true
      console.log("update requested", query_type)
  
      // If metadata is null or undefined, get a fresh canvas
      if (!(wiz.tweets_meta != null))
        wiz.tweets_meta = wiz.makeTweetsMeta(null)
      // If we were asked for an update but don't have timeline, get timeline instead
      if(query_type == "update" && !wiz.has_timeline) query_type = "timeline"
      //If we were asked for the archive
      if(query_type == "archive"){
        console.log("updating archive")
        utils.getData("temp_archive").then((temp_archive) => {
          console.assert(temp_archive != null)
          console.log("got temp_archive")
          console.time("out save tweets")
          wiz.saveTweets(temp_archive, query_type).then((_tweets)=>{
            // tweets = _tweets
            // set has_archive
            wiz.has_archive = true
            console.log("SET HAS ARCHIVE", wiz.tweets_meta)
            // set has_archive
            wiz.midRequest = false
            // wiz.getProfilePics()
            utils.removeData(["temp_archive"])
            utils.msgCS({type: "tweets-done", query_type: query_type})
            console.log("archive done!")
          })
          console.timeEnd("out save tweets")
        })
      } else{
        wiz.query(auth, wiz.tweets_meta, query_type).then((_tweets)=>{
          // tweets = _tweets
          utils.msgCS({type: "tweets-done", query_type: query_type})
          wiz.midRequest = false
          switch(query_type){
            case "timeline":
              wiz.has_timeline = true
              console.log("SET HAS TIMELINE", wiz.tweets_meta)
              break;
            case "update":
              break;
          }
        })
      }
      return
    }
        
}

class NLP{
  constructor(){
    this._inited = false
    this.tweet_fields = [
      "id",
      "text", 
      "name", 
      "username", 
      //"time", 
      "reply_to",
      "mentions"
    ]
    this._index = null; 
    this._midSearch = false
    this._nextSearch = null
    this._search_results = []
  }

  

  get index(){return this._index}
  set index(_index){
    console.time("setting index")
    this._index = _index
    worker.postMessage({type:'setIndex', index_json:_index.toJSON()})
    // utils.setData({index: _index.toJSON()}).then(()=>{console.timeEnd("setting index")})
    
  }
  get search_results(){return this._search_results}
  set search_results(_search_results){
    this._search_results = _search_results
    utils.setData({search_results: _search_results})
  }

  get inited(){return this._inited}
  set inited(inited){
    this._inited = inited
    wiz.updateSync()
  }

  // when we leave a search, we check for the next one
  get midSearch(){return this._midSearch}
  set midSearch(midSearch){
    this._midSearch = midSearch
    if(!midSearch && this.inited){
      if(this.nextSearch != null){
        console.log("finished search, picking back up ", this.nextSearch)
        this.search(this.nextSearch)
      }
    }
  }

  // if we're not searching, do that. if we're mid search, save the next search and it will be done asap
  get nextSearch(){return this._nextSearch}
  set nextSearch(nextSearch){
    if(this.inited && !this.midSearch && this.nextSearch != null){
      console.log("searching for ", nextSearch)
      this._nextSearch = null
      this.search(nextSearch)
    }else{
      console.log("waiting. busy for ", nextSearch)
      this._nextSearch = nextSearch
    }
  }


  async init(){
    worker.postMessage({type:'getIndex'})
    // let loaded = await this.loadIndex()
    // if(loaded != null){
    //   this._index = loaded
    //   console.log("Index loaded", this.index)
    // } else{
    //   this.index = await this.makeIndex()
    //   console.log("Index initialized", this.index)
    // }
    // this.inited = true
  }

  async onIndexLoaded(index_json){
    let loaded =  index_json != null ? elasticlunr.Index.load(index_json) : null
    if(loaded != null){
      nlp._index = loaded
      console.log("Index loaded", nlp.index)
    } else{
      nlp.index = await nlp.makeIndex()
      console.log("Index initialized", nlp.index)
    }
    nlp.inited = true
  }

  // async loadIndex(){
  //   let index_json = await utils.getData("index")
  //   let _index = index_json != null ? elasticlunr.Index.load(index_json) : null
  //   return _index
  // }

  async updateIndex(tweets){
    if (this.index == null){
      this.index = await this.makeIndex()
    } 
    // let new_tweets = this.getNewTweets({},tweets)
    this.index = await this.addToIndex(tweets)
  }

  async makeIndex(){
    // tweets = wiz.sortTweets(_tweets)
    let start = (new Date()).getTime()
    console.log("making index...")
    var _index = elasticlunr(function () {
      this.setRef('id');
      for (var field_name of nlp.tweet_fields){
        this.addField(field_name);
      }
    });
    return _index
  }

  async addToIndex(_tweets){
    console.time(`add ${Object.keys(_tweets).length} To Index`)

    for (const [id, tweet] of Object.entries(_tweets)){
      var doc = {}
      for (var f of nlp.tweet_fields){
        doc[f] = tweet[f]
      }
      doc["id"] = id
      this.index.addDoc(doc)
    }
    console.timeEnd(`add ${Object.keys(_tweets).length} To Index`)
    return this.index
  }

  getNewTweets(old_t,new_t){
    // console.log("getnewtweets")
    let old_keys = old_t != null ? Object.keys(old_t) : []
    let new_key_vals = Object.entries(new_t)
    const _filtered = Object.fromEntries(
      new_key_vals.filter(key_val => {return !old_keys.includes(key_val[0])})
    )
    return _filtered
  }

  //** Find related tweets */
  async getRelated(query, n_tweets = 20) {

    // if (Object.keys(tweets).length <= 0) tweets = sortTweets(_tweets)
    //results are of the format {ref, doc}
    let results = this.index.search(query, {
      fields: {
          text: {boost: 3},
          name: {boost: 1},
          username: {boost: 1},
          reply_to: {boost: 1},
          mentions: {boost: 1}
        },
      boolean: "OR",
      expand: true
    });
    // console.log("bg search results:", results)
    return results
  }

  async resultToTweets(results, n_tweets){

    let related = []

    for (let res of results){
      if(utils.options.getRetweets){
        related.push(await utils.getDB(res.ref,'tweets'))
      } else{
        if(res.doc.username == wiz.user_info.screen_name) related.push(await utils.getDB(res.ref,'tweets'))
      }
      if(related.length >= n_tweets) break;
    }    
    
    // console.log("results after filtering", related)
    // for(let res of results.slice(0,n_tweets)){
    //   related.push(await utils.getDB(res.ref,'tweets'))
    // }
    return related
  }

  async search(_query, n_tweets = 20){
    nlp.midSearch = true
    let query =  _query.repeat(1) 
    nlp._nextSearch = null
    let return_related = []
    if(wiz.tweet_ids.length <= 0 || !(this.index != null)) throw("searching before tweets loaded")

    
    // If query's empty just return latest 
    // let latest = wiz.getLatest(wiz.tweets, n_tweets)
    if (query == ''){
      return_related = wiz.latest_tweets
    } else{
      console.time(`Searching ${query}`);
      let results = await this.getRelated(query, n_tweets)
      // if no results, get latest tweets
      // let related = results.length > 0 ? resultTweets(results) : wiz.latest_tweets
      let related = await this.resultToTweets(results,n_tweets)
      
      console.timeEnd(`Searching ${query}`);
      return_related = related
      console.log("related",related)
    }
    nlp.midSearch = false
    this.search_results = return_related
    return return_related
  }

}
  
  

// changes: each has oldValue and newValue
// area: could be sync local or managed
async function onStorageChanged(changes, area){
    if (area != 'local') return null 
    let oldVal = {}
    let newVal = {}
    let changedItems = Object.keys(changes)
    for(let item of changedItems){
      oldVal = changes[item].oldValue
      newVal = changes[item].newValue
      if (oldVal == newVal) break;
      switch(item){
        case "options":
          console.log("options changed")
          utils.options = newVal != null ? newVal : utils.options;
          // chrome.tabs.reload(utils.tabId);
          break;
        default:
          break;
      }
    }
  }

//** Handles messages sent from popup or content scripts */
async function onMessage(m, sender) {
    console.log("message received:", m);
    let auth_good = null
    let auth_wrapper = async function(func, arg){
      auth_good = await auth.testAuth()
      if(auth_good != null){
        func(arg);
      }
      else{
        //console.log("auth bad, loadin")
        auth_good = await auth.getAuth()
        if (auth_good) func(arg)
      }
    }
    switch (m.type) {
      case "cs-created":
        let tid = sender.tab.id
        utils.tabId = tid
        if(!wiz.inited) wiz.init()
        if(!nlp.inited) nlp.init()
        break;
  
      case "query":
        auth_wrapper(wiz.handleQuery,m.query_type)
        break;
      
      case "new-tweet":
        auth_wrapper(wiz.handleQuery,'update')
        break;
      
      case "search":
        nlp.nextSearch = m.query
        break;
      
      case "interrupt-query":
        wiz.interrupt_query = true;
        break;
  
      case "temp-archive-stored":
        wiz.handleQuery(m);
        break;

      case "clear":
        utils.clearStorage().then(()=>{
          try{
            console.log("reloading")
            chrome.tabs.reload(utils.tabId);
          } catch(e){
            console.log("couldn't reload twitter tab. None open?")
          }
        })
        break;
    }
    return //Promise.resolve('done');
    ;
  }
   

function initWorker(){
  let worker = new Worker(chrome.extension.getURL('js/bundleWorker.js'));
  worker.onmessage = onWorkerMessage
  worker.onerror = onWorkerError
  return worker
}

function onWorkerMessage(ev){
  console.log("Messaged worker: ", ev.data)
  switch(ev.data.type){
    case 'getIndex':
      console.log('got index', ev.data.index_json)
      nlp.onIndexLoaded(ev.data.index_json)
      break;
    case 'setIndex':
      console.log('set index', ev.data.index_json)
      break;
  }
}

function onWorkerError(err){
  console.log(err.message, err.filename);
  console.log(err);
}

function main(){
    chrome.runtime.onInstalled.addListener(utils.onInstalled);
    chrome.storage.onChanged.addListener(onStorageChanged);
    chrome.runtime.onMessage.addListener(onMessage);
    chrome.webRequest.onBeforeSendHeaders.addListener(
      c => {
        // on mac there's a bug where updateAuth is called before auth is defined, so this is checking that
        // if (!( auth != 'undefined')){auth = new Auth();} 
        utils.processHeaders(c.requestHeaders);
      },
      { urls: ["https://api.twitter.com/*"] },
      ["requestHeaders"]
    );
    // Basically every time we change tabs or the tab url is updated, update tabId and send msg to CS
    chrome.tabs.onActivated.addListener(utils.onTabActivated);
    chrome.tabs.onUpdated.addListener(utils.onTabUpdated);
  }

  let utils = new Utils();  
  let auth = new Auth();  
  let wiz = new TweetWiz();  
  let nlp = new NLP();
  let worker = initWorker()
  main()
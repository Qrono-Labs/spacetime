// "use strict";
let idb = require('idb')
let elasticlunr = require('elasticlunr')
let db = {}
idb.openDB('ThreadHelper', 1).then((_db)=>{db = _db})

self.addEventListener('message', onMessage)


async function onMessage(ev){
    let data = ev.data;
    console.log("ON MESSAGE", ev)
    db = db != null ? db : await idb.openDB('ThreadHelper', 1)
    let index_json = ''
    console.log("WORKER GOT MESSAGE", ev.data)
    switch(data.type){
//        case 'Get Started':
//            self.postMessage('Web Worker Started');
//            break;
//        case 'Other':
//            self.postMessage('Other task...');
//            break;
        case 'getIndex':
            // let db = await idb.openDB('ThreadHelper', 1)
            index_json = await getIndex(db).then()
            self.postMessage({type:`getIndex`, index_json: index_json});
            break;
        case 'setIndex':
            // let db = await idb.openDB('ThreadHelper', 1)
            await setIndex(db, data.index_json)
            self.postMessage({type:`setIndex`, index_json: data.index_json});
            // data.utils.putDB([{index: data.index_json, id:1, time:2}], 'staged_tweets').then(()=>{console.timeEnd("set index")})
            break;
        case 'handleQuery':
            console.log("handling archive")
            handleQuery(data)
            self.postMessage({type:`handleQuery`});
            break;
        case 'getProfilePics':
            console.log('(not) getting profile pics')
            break;
        case 'updateIndex':
            let tweets_to_add = data.tweets_to_add
            let ids_to_remove = data.ids_to_remove
            index_json = await getIndex(db)
            console.assert(index_json!=null)
            let loaded_index = index_json != null ? elasticlunr.Index.load(index_json) : makeIndex()
            let _index = await addToIndex(loaded_index, tweets_to_add)
            _index = await removeFromIndex(_index, ids_to_remove)
            index_json = _index.toJSON()
            await setIndex(db, index_json)
            self.postMessage({type:'updateIndex', index_json: index_json})
            break;
        default:
            console.log('Invalid access');
            self.postMessage(`got ${data.type}`);
            // self.close();
    }
}

function makeIndex(){
    tweet_fields = [
        "id",
        "text", 
        "name", 
        "username", 
        //"time", 
        "reply_to",
        "mentions"
    ]
  // tweets = wiz.sortTweets(_tweets)
  let start = (new Date()).getTime()
  console.log("making index...")
  var _index = elasticlunr(function () {
    this.setRef('id');
    for (var field_name of tweet_fields){
      this.addField(field_name);
    }
  });
  return _index
}

async function getIndex(db){
    console.time("worker getting index")
    console.log("loaded db in worker", db)
    let index_json = await db.get('misc', 'index');   
    console.timeEnd("worker getting index")
    return index_json
}

async function setIndex(db, index_json){
    console.time("worker setting index")
    console.log("loaded db in worker", db)
    db.put('misc', index_json, 'index');
    console.timeEnd("worker setting index")
}


async function addToIndex(index,tweets){
    console.time(`add ${Object.keys(tweets).length} To Index`)
    let tweet_fields = [
        "id",
        "text", 
        "name", 
        "username", 
        //"time", 
        "reply_to",
        "mentions"
      ]

    for (const [id, tweet] of Object.entries(tweets)){
        var doc = {}
        for (var f of tweet_fields){
        doc[f] = tweet[f]
        }
        doc["id"] = id
        index.addDoc(doc)
    }
    console.timeEnd(`added ${Object.keys(tweets).length} To Index`)
    return index
}

async function removeFromIndex(index, tweet_ids){
    for(let id of tweet_ids){
        index.removeDocByRef(id)
    }
    console.timeEnd(`added ${tweet_ids.length} To Index`)
    return index
}
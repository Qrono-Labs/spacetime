"use strict";

const nlp = (function() {

  const tweet_fields = [
    "id",
    "text", 
    "name", 
    "username", 
    //"time", 
    "reply_to",
    "mentions"
  ]
  var index = null;
  let tweets = []
  return { getRelated: getRelated, makeIndex: makeIndex };

  async function makeIndex(_tweets){
    tweets = _tweets
    console.log("making index")
    var _index = elasticlunr(function () {
      this.setRef('num');
      for (var field_name of tweet_fields){
        this.addField(field_name);
      }
    });

    for (const [num, tweet] of tweets.entries()){
      var doc = {}
      for (var f of tweet_fields){
        doc[f] = tweet[f]
      }
      doc["num"] = num
      _index.addDoc(doc)
    }
    index = _index
    return _index
  }

  //** Find related tweets */
  async function getRelated(tweet_text, n_tweets = 20) {
    if (index == null){
      index = await makeIndex(tweets)
    }
    var results = index.search(tweet_text, {
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
    return results.slice(0,n_tweets).map((x)=>tweets[parseInt(x.ref)])
  }

})();





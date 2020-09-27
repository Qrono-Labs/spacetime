import { h, render, Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useStream } from './useStream.jsx';
import { useStorage } from './useStorage.jsx';
import { msgBG, makeOnStorageChanged, getData } from '../utils/dutils.jsx';
import { isNil } from 'ramda'



export function SyncIcon(props){

  const sync = useStorage('sync', false)
  const [_syncDisplay, setSyncDisplay] = useStorage('syncDisplay', 'default sync display msg')


  function onSyncClick(){
    console.log("clicked sync")
    msgBG({type:"query", query_type: "update"})
  }

  return (
    <div class={`sync ${sync ? 'synced' : 'unsynced'}`} onClick={onSyncClick}>
      <span class="tooltiptext"> sync msg: {_syncDisplay} </span>  
    </div>
  );
}




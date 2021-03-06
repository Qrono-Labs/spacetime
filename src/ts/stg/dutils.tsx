import Kefir, { Emitter, Observable, Stream } from 'kefir';
import 'chrome-extension-async';

import {
  curry,
  defaultTo,
  difference,
  forEach,
  fromPairs,
  head,
  isNil,
  keys,
  length,
  lensPath,
  map,
  mergeDeepLeft,
  pair,
  path,
  pipe,
  prop,
  propEq,
  range,
  set,
  slice,
  tail,
  tap,
  toPairs,
  when,
  zipObj,
  unionWith,
  eqBy,
  __,
  union,
} from 'ramda'; // Function
import { Msg } from '../types/msgTypes';
import {
  Option,
  Options,
  StorageChange,
  StorageInterface,
} from '../types/stgTypes';
import {
  defaultOptions,
  defaultStorage as _defaultStorage,
} from './defaultStg';
import { asyncTimeFn, currentValue, inspect, timeFn } from '../utils/putils';

(Kefir.Property.prototype as any).currentValue = currentValue;

let defaultStorage: () => StorageInterface = _defaultStorage;

/* Development experience */

export const SERVE = process.env.DEV_MODE == 'serve';
export function initStg() {
  if (!SERVE) {
    console.log('not SERVE');
    defaultStorage = _defaultStorage;
  } else {
    // global.chrome = chromeMock;
    defaultStorage = devStorage;

    console.log('dutils', {
      SERVE,
      chrome: global.chrome,
      defaultStorage: defaultStorage(),
    });
    // setData(defaultStorage());
  }
}

/* Storage API */

// returns a {key: value} object
export const getData = async (keys) => {
  if (SERVE) {
    return getDataLocal(keys);
  } else {
    return getDataChrome(keys);
  }
};
export const setData = async (key_vals) => {
  // console.log('setData', key_vals);
  if (SERVE) {
    return setDataLocalSync(key_vals);
  } else {
    return setDataChrome(key_vals);
  }
};
export const removeData = async (keys) => {
  if (SERVE) {
    return removeDataLocal(keys);
  } else {
    return removeDataChrome(keys);
  }
};

/* Local Storage API */
//
const getAllDataLocal = async () => {
  const getPairByIndex = (i) =>
    pair(localStorage.key(i), localStorage.getItem(localStorage.key(i)));
  pipe(() => range(0, localStorage.length - 1), map(getPairByIndex), fromPairs);
};
const getDataLocal = async (keys: string[] | null) => {
  return new Promise(function (resolve, reject) {
    if (keys == null) {
      resolve(getAllDataLocal());
    } else {
      const results = zipObj(
        keys,
        map(
          pipe(
            (x) => localStorage.getItem(x),
            (x) => JSON.parse(x)
          ),
          keys
        )
      );
      resolve(results);
    }
  });
};

const makeStorageChange = ([key, val]) => {
  return {
    itemName: key,
    newValue: val,
    oldValue: JSON.parse(localStorage.getItem(key)),
  };
};
const makeStgEvent = (key_vals: object) => {
  // console.log('makeStgEvent', key_vals);
  return new CustomEvent('localStorage', {
    detail: {
      changes: zipObj(
        keys(key_vals),
        map(makeStorageChange, toPairs(key_vals))
      ),
      area: 'localStorage',
    },
    bubbles: !1,
    cancelable: !0,
  });
};
export const setDataLocalSync = (key_vals: object) => {
  document.dispatchEvent(makeStgEvent(key_vals));
  const prepData = pipe(
    toPairs,
    map(([k, v]) => [k, JSON.stringify(v)])
  );
  const setString = ([k, v]) => localStorage.setItem(k, v);
  forEach(setString, prepData(key_vals));
};
const setDataLocal = async (key_vals: object) => {
  return new Promise(function (resolve, reject) {
    setDataLocalSync(key_vals);
    resolve(key_vals);
  });
};
const removeDataLocal = async (keys: string[]) => {
  return new Promise(function (resolve, reject) {
    forEach(localStorage.removeItem, keys);
    resolve(true);
  });
};

/* Chrome Storage API */

//returns a promise that gets a value from chrome local storage
export async function getDataChrome(keys: string[] | null): Promise<any> {
  return new Promise(function (resolve, reject) {
    // chrome.storage.local.get([key], function (items: {[x: string]: unknown;}) {
    chrome.storage.local.get(keys, function (result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(result);
      }
    });
  });
}
export async function setDataChrome(key_vals: Object): Promise<any> {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.set(key_vals, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      } else {
        // console.log('setDataChrome', key_vals);
        resolve(key_vals);
      }
    });
  });
}
export async function removeDataChrome(keys: string[]): Promise<any> {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.remove(keys, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(true);
      }
    });
  });
}

// returns the whole stg
export const cleanOldStorage = async () => {
  if (SERVE) {
  } else {
    const newKeys: string[] = keys(defaultStorage());
    const oldKeys: string[] = keys(await getData(null));
    removeData(difference(oldKeys, newKeys));
    return await getData(null);
  }
};

export const softUpdateStorage = async () => {
  if (SERVE) {
  } else {
    const oldStg: object = await getData(null);
    setData(mergeDeepLeft(oldStg, defaultStorage()));
  }
};

export const forceUpdateStorage = async () => {
  if (SERVE) {
  } else {
    setData(defaultStorage());
  }
};

export const resetStorage = () => setData(defaultStorage());
export const resetStorageField = (key: string) =>
  setData({ [key]: defaultStorage()[key] });

// returns the value for that key
export const getStg = (key: string) =>
  getData([key]).then(
    pipe(prop(key), defaultTo(defaultStorage()[key]), addNewDefault(key))
  );
// getData(key).then(
//   pipe(prop(key), defaultTo(defaultStorage()[key])  , addNewDefault(key))
// );

export const setStg = curry(async (key: string, val: any) => {
  // console.log('setStg', { key, val });
  return setData({ [key]: val });
});

export const getStgPath = curry((_path: string[]) =>
  getStg(head(_path)).then(path(tail(_path)))
);
export const setStgPath = curry(async (_path: string[], val) =>
  getStg(head(_path)).then(
    pipe(set(lensPath(tail(_path)), val), tap(setStg(head(_path))))
  )
);

// Modify storage with a function fn
export const modStg = curry(async (key: string, fn) => {
  const oldVal = await getStg(key);
  const newVal = fn(oldVal);
  // console.log('modStg', { key, fn, oldVal, newVal });
  return setStg(key, newVal);
  // return setData({ [key]: newVal });
});

// needs to go to the opposite or else doesn't throw a stgchange
export const setStgFlag = async (name: string, active: boolean) => {
  await setStg(name, !active);
  await setStg(name, active);
};

const enqueue = curry(<T,>(incoming: T[], old: T[]): T[] => {
  return defaultTo([], old).concat(incoming);
});

export const enqueueStg = curry(async (key: string, vals: any[]) => {
  // console.log('enqueueStg', { key, vals });
  modStg(key, enqueue(vals));
});

export const enqueueStgNoDups = curry(async (key: string, vals: any[]) => {
  // console.log('enqueueStg', { key, vals });
  modStg(key, union(vals));
});

export const enqueueUserStg = curry(async (key: string, vals: any[]) => {
  // console.log('enqueueTweetStg', { key, vals });
  const enqueueNoDupIds = (olds) =>
    unionWith(eqBy(prop('id_str')), vals, defaultTo([], olds));
  modStg(key, enqueueNoDupIds);
});

export const enqueueTweetStg = curry(async (key: string, vals: any[]) => {
  // console.log('enqueueTweetStg', { key, vals });
  const enqueueNoDupIds = (olds) =>
    unionWith(eqBy(prop('id')), vals, defaultTo([], olds));
  modStg(key, enqueueNoDupIds);
});

//
export const dequeueStg = curry(async (key: string, N: number) => {
  const curVal: any[] = defaultTo([], await getStg(key));
  const workLoad = slice(0, N, curVal);
  // console.log('dequeueStg', { key, N, workLoad });
  const dequeueMod = pipe(defaultTo([]), slice(N, Infinity));
  modStg(key, dequeueMod);
  return workLoad;
});

// Dequeues and places in a work queue called {key}+"_work_queue". Need to clean that queue with `dequeueStg` after using
export const dequeue4WorkStg = curry(async (key: string, N: number) => {
  const workLoad: any[] = await dequeueStg(key, N);
  enqueueStg(key + '_work_queue', workLoad);
  return workLoad;
});

export const dequeueWorkQueueStg = curry((key, N) =>
  dequeueStg(key + '_work_queue', N)
);

/* Options API */

export const getOptions = async (): Promise<Options> =>
  getStg('options').then(
    pipe(defaultTo(defaultOptions()), addNewDefaultOptions)
  );

export const getOption = async (name: string): Promise<Option> =>
  getStgPath(['options', name]);

export const setOption = (name: string) =>
  setStgPath(['options', name, 'value']);
export const applyToOptionStg = curry(
  async (name: string | number, fn: (x: unknown) => any) => {
    return getOptions().then(pipe(path([name, 'value']), fn, setOption(name)));
  }
);

/* msg API */

const typeOnlyMsg = (msg) => {
  return keys(msg).includes('type') && length(keys(msg)) <= 1;
};
export function postMsg(_msg: Msg) {
  const msg = typeOnlyMsg(_msg) ? { ..._msg, hash: Math.random() } : _msg;
  if (SERVE) {
    console.log('postMsg', { msg });
    window.postMessage(msg, '*');
  } else {
    chrome.runtime.sendMessage(msg);
  }
}

export const rpcBg = async (fnName, args?) => {
  try {
    console.log('rpcBg 0', { fnName, args });
    const returnValue = await chrome.runtime.sendMessage({
      type: 'rpcBg',
      fnName,
      args: defaultTo({}, args),
    });
    console.log('rpcBg 0', { fnName, args, returnValue });
    return returnValue;
  } catch (error) {
    console.error(`rpcBg ${fnName} failed`, { error, args });
    return [];
  }
};

export function msgBG(msg: Msg) {
  if (SERVE) {
    window.postMessage(msg, '*');
  } else {
    chrome.runtime.sendMessage(msg);
  }
}
export function msgCS(tabId: number, msg: CsMsg) {
  chrome.tabs.sendMessage(tabId, msg);
}

/* Helper functions */
const isObject = (x) =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const addNewDefault = curry((key: string | number, oldItem) =>
  pipe(
    () => oldItem,
    when(isObject, (x) => mergeDeepLeft(x, defaultStorage()[key]))
  )()
);

const addNewDefaultOptions = (oldOptions) =>
  mergeDeepLeft(oldOptions, defaultOptions());

// makes an onStorageChange function given an act function that's usually a switch over item keys that have changed
export function makeOnStorageChanged(act: (stgCh: StorageChange) => void): any {
  // console.log('makeOnStorageChanged', { act });
  const prodFn = (changes: StorageChange, area: string): void => {
    // console.log('stg change', { changes, area });
    if (!['local', 'sync', 'localStorage'].includes(area)) return null;
    let oldVal = {};
    let newVal = {};
    let changedItems = Object.keys(changes);
    for (let itemName of changedItems) {
      oldVal = changes[itemName].oldValue;
      newVal = changes[itemName].newValue;
      if (oldVal == newVal) break;
      act({ itemName, oldVal, newVal });
    }
  };
  const devFn = (changes) => prodFn(changes, 'localStorage');
  return SERVE ? devFn : prodFn;
}

const isStgItemSame = (x: StorageChange) =>
  (isNil(x.oldVal) && isNil(x.newVal)) || x.oldVal === x.newVal;

export const isOptionSame = curry(
  (name: string, x: StorageChange): boolean =>
    isStgItemSame(x) ||
    (!isNil(x.oldVal) &&
      !isNil(x.newVal) &&
      path(['oldVal', name, 'value'], x) === path(['newVal', name, 'value'], x))
);

/* Observers */
/* Obs Stg */
export const makeCustomEventObs = (
  eventName: string,
  makeEmit
): Stream<any, Error> => {
  const payloadPath = {
    message: ['data'],
    localStorage: ['detail', 'changes'],
  };
  // document.addEventListener('localStorage', console.log);
  const obs = Kefir.stream<any, Error>((emitter) => {
    // console.log('CustomEventObs ' + eventName, { makeEmit });
    const emit = makeEmit(emitter);
    const target = eventName == 'message' ? window : document;
    target.addEventListener(
      eventName,
      pipe(
        // inspect(eventName + ' event'),
        path(payloadPath[eventName]),
        (x) => {
          emit(x);
        }
      )
    );
    return () => {
      document.removeEventListener(eventName, emit);
      emitter.end();
    };
  });
  return obs;
};

export const makeEventObs = curry(
  (event: chrome.events.Event<any>, makeEmit): Stream<any, Error> => {
    return Kefir.stream((emitter) => {
      const emit = makeEmit(emitter);
      event.addListener(emit);
      return () => {
        event.removeListener(emit);
        emitter.end();
      };
    });
  }
);
var stgChObsCnt = 0;
export const makeStorageChangeObs = (): Observable<StorageChange, Error> => {
  stgChObsCnt += 1;
  const makeEmitStgCH = (emitter: Emitter<StorageChange, Error>) => {
    // console.log('makeEmitStgCH');
    return makeOnStorageChanged((x: StorageChange): void => {
      // console.log('emitting');
      emitter.emit(x);
    });
  };
  if (SERVE) {
    const obs = makeCustomEventObs('localStorage', makeEmitStgCH);
    return obs;
  } else {
    const obs = makeEventObs(chrome.storage.onChanged, makeEmitStgCH);
    return obs;
  }
};
export const stgPathObs = (
  storageChangeObs: Observable<StorageChange, Error>,
  _path: string[]
): Observable<any, Error> => {
  return storageChangeObs
    .filter(propEq('itemName', _path[0]))
    .map(path(['newVal', ...slice(1, Infinity, _path)]))
    .toProperty();
};

export const makeStgPathObs = (_path: string[]): Observable<any, Error> => {
  return stgPathObs(makeStorageChangeObs(), _path);
};
export const makeStgItemObs = (itemName) =>
  makeStgPathObs([itemName]).map(inspect('StgItemObs'));

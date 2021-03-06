import '@babel/polyfill';
import { isNil, path } from 'ramda';
import { SearchResult } from '../../types/stgTypes';
import { thTweet } from '../../types/tweetTypes';
import { toggleDebug } from '../../utils/putils';
import { dbOpen } from '../../bg/idb_wrapper';
import { search } from '../../bg/nlp';
import { makeSearchResponse } from '../../bg/stgOps';
import { ThIndexMetadata } from '../components/Search';
import { loadIndexFromIdb } from '../storage/devStgUtils';

// var DEBUG = process.env.NODE_ENV != 'production';
// toggleDebug(window, DEBUG);

const db_promise = dbOpen();
// var idx_promise = loadIndexFromIdb(db_promise);
var idx_promise = new Promise(() => {});

export async function seek(
  filters,
  accsShown,
  resultN,
  query
): Promise<SearchResult[]> {
  const index = await idx_promise;
  // console.time(`[TIME] worker seek`);
  const res = await search(filters, accsShown, resultN, index, query);
  const response = await makeSearchResponse(db_promise, res);
  console.log('worker seek', { res, response, index });
  // console.timeEnd(`[TIME] worker seek`);
  return response;
}

const idxSize = (index): number | null =>
  isNil(index) ? null : path(['documentStore', 'length'], index);

export async function loadIndex(): Promise<ThIndexMetadata> {
  idx_promise = loadIndexFromIdb(db_promise);
  const index = await idx_promise;
  return { size: idxSize(index) };
}

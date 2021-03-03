import { h, Fragment, render, Component } from 'preact';
import {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from 'preact/hooks';
import { csEvent } from '../utils/ga';
import { getActiveComposer } from '../utils/wutils';
import { thTweet } from '../types/tweetTypes';
import ReplyIcon from '../../images/reply.svg';
import RetweetIcon from '../../images/retweet.svg';
import LikeIcon from '../../images/like.svg';
import FullLikeIcon from '../../images/like_full.svg';
import PencilIcon from '../../images/pencil.svg';
import LinkIcon from '../../images/link.svg';
import { andThen, any, defaultTo, isNil, last, pipe, prop } from 'ramda';
import {
  sendLikeRequest,
  sendRetweetRequest,
  sendUnlikeRequest,
  sendUnretweetRequest,
  fetchStatus,
} from '../bg/twitterScout';
import { useStorage } from '../hooks/useStorage';
import { AuthContext } from './ThreadHelper';
import { apiSearchToTweet } from '../bg/tweetImporter';
import { inspect } from '../utils/putils';
import { DropdownMenu } from './Dropdown';
import defaultProfilePic from '../../images/defaultProfilePic.png';
import Tooltip from './Tooltip';

const isProduction = process.env.NODE_ENV != 'development';

const getUserUrl = (username: string) => `https://twitter.com/${username}`;
const getTweetUrl = (tweet: thTweet) =>
  getUserUrl(tweet.username) + `/status/${tweet.id}`;

const formatNumber = function (number) {
  if (number >= 1000000) {
    return (number / 1000000).toPrecision(2) + 'M';
  }
  if (number >= 10000) {
    return Math.floor(number / 1000) + 'K';
  } else if (number >= 1000) {
    return (number / 1000).toPrecision(2) + 'K';
  } else {
    return number.toString();
  }
};

const countReplies = (t) => t.reply_count ?? 0;
export const ReplyAction = ({ tweet }) => {
  const [count, setCount] = useState(countReplies(tweet));

  useEffect(() => {
    setCount(countReplies(tweet));
    return () => {};
  }, []);

  return (
    <div class="th-icon-field">
      <div class="th-reply-container inline-flex items-center">
        <ReplyIcon />{' '}
        <span class="ml-1">{count > 0 ? formatNumber(count) : ''}</span>
      </div>
    </div>
  );
};

const countRts = (t) =>
  (t.retweet_count ?? (t.retweeted ? 1 : 0)) + (t.quote_count ?? 0);
const RetweetAction = ({ tweet }: { tweet: thTweet }) => {
  const [active, setActive] = useState(tweet.retweeted ?? false);
  const [count, setCount] = useState(countRts(tweet));
  const [id, setId] = useState(tweet.id);
  const auth = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setActive(tweet.retweeted ?? false);
    setCount(countRts(tweet));
    setId(tweet.id);
    return () => {};
  }, []);

  const onFunc = () => {
    setActive(true);
    setCount(count + 1);
    sendRetweetRequest(auth, id);
  };
  const offFunc = () => {
    setActive(false);
    setCount(count - 1);
    sendUnretweetRequest(auth, id);
  };

  var quoteTweet = useCallback(
    function () {
      window.open(
        `https://twitter.com/intent/tweet?url=https://twitter.com/${tweet.username}/status/${tweet.id}`,
        '_blank'
      );
    },
    [tweet]
  );

  const makeRtItems = () => {
    return [
      // {id: 'Load Archive', leftIcon: <GearIcon />, effect: ()=>{}},
      {
        id: active ? 'Undo Retweet' : 'Retweet',
        leftIcon: <RetweetIcon />,
        effect: active ? offFunc : onFunc,
      },
      { id: 'Quote Tweet', leftIcon: <PencilIcon />, effect: quoteTweet },
    ];
  };

  return (
    <div class="relative flex flex-grow">
      <div class="th-icon-field ">
        <div
          class={
            (active ? `text-green-600` : ``) +
            ' th-rt-container inline-flex items-center'
          }
          // onClick={active ? offFunc : onFunc}
          onClick={() => {
            setOpen(!open);
          }}
        >
          {active ? (
            <RetweetIcon class={`stroke-1 stroke-current fill-current`} />
          ) : (
            <RetweetIcon />
          )}
          <span class="ml-1">{count > 0 ? formatNumber(count) : ''}</span>
        </div>
      </div>
      {open && (
        <DropdownMenu
          name={'rt-button'}
          componentItems={[]}
          filterItems={[]}
          items={makeRtItems()}
          debugItems={[]}
          closeMenu={() => setOpen(false)}
          itemClickClose={true}
        />
      )}
    </div>
  );
};

const countFavs = (t) => t.favorite_count ?? (t.favorited ? 1 : 0);
const LikeAction = ({ tweet }) => {
  const [active, setActive] = useState(tweet.favorited ?? false);
  const [count, setCount] = useState(countFavs(tweet));
  const [id, setId] = useState(count);
  const auth = useContext(AuthContext);

  useEffect(() => {
    setActive(tweet.favorited ?? false);
    setCount(countFavs(tweet));
    setId(tweet.id);
    return () => {};
  }, []);

  const onFunc = (e) => {
    setActive(true);
    setCount(count + 1);
    sendLikeRequest(auth, id);
  };
  const offFunc = (e) => {
    setActive(false);
    setCount(count - 1);
    sendUnlikeRequest(auth, id);
  };

  return (
    <div class="th-icon-field">
      <div
        class={
          (active ? `text-red-700` : ``) +
          ' th-like-container inline-flex items-center'
        }
        onClick={active ? offFunc : onFunc}
      >
        {active ? (
          <FullLikeIcon class={`stroke-1 stroke-current fill-current`} />
        ) : (
          <LikeIcon />
        )}
        {'  '}
        <span class="ml-1">{count > 0 ? formatNumber(count) : ''}</span>
      </div>
    </div>
  );
};

export const CopyAction = ({
  url,
  setCopyText,
}: {
  url: string | null;
  setCopyText;
}) => {
  const linkField = useRef(null);
  const [copied, setCopied] = useState(false);

  let copyUrl = function (e: Event) {
    if (isNil(url)) return;
    csEvent('User', 'Clicked tweet', '');

    const input = getActiveComposer();
    linkField.current.style.display = 'flex';
    linkField.current.select();
    document.execCommand('copy');
    linkField.current.style.display = 'none';

    selectComposer(input);
    setCopied(true);
    setTimeout(function () {
      setCopied(false);
    }, 1000);
    return;
  };

  return (
    <div class="th-icon-field">
      <textarea class="th-link hidden" ref={linkField}>
        {url}
      </textarea>

      <Tooltip content={'Copy URL'} direction="bottom">
        <div
          class={
            'th-share-container inline-flex items-center' +
            (isNil(url) ? 'text-red-200' : '')
          }
          onClick={copyUrl}
        >
          <LinkIcon /> <span class="ml-1">{copied ? 'copied!' : null}</span>
        </div>
      </Tooltip>
    </div>
  );
};

export function Tweet({ tweet, score }: { tweet: thTweet; score?: number }) {
  // placeholder is just text
  // const [auth, setAuth] = useStorage('auth', null);
  const [copyText, setCopyText] = useState('copy');
  const [_tweet, setTweet] = useState(tweet);
  // const [favCount, setFavCount] = useState(0);
  // const [replyCount, setReplyCount] = useState(0);
  // const [rtCount, setRtCount] = useState(0);
  // const [rtActive, setRtActive] = useState(false);
  // const [favActive, setFavActive] = useState(false);

  const setCounts = (t) => {
    // setReplyCount(t.reply_count ?? 0);
    // setRtCount(
    //   (t.retweet_count ?? (t.retweeted ? 1 : 0)) + (t.quote_count ?? 0)
    // );
    // setFavCount(t.favorite_count ?? (t.favorited ? 1 : 0));
    // setRtActive(t.retweeted ?? false);
    // setFavActive(t.favorited ?? false);
  };

  useEffect(() => {
    setCounts(_tweet);
    return () => {};
  }, [_tweet]);

  let reply_text = '';
  try {
    reply_text = getReplyText(tweet.reply_to, tweet.mentions);
  } catch (e) {
    console.log('ERROR [getReplyText]', { e, tweet });
  }

  const reformattedText = (tweet) =>
    reformatText(
      tweet.text,
      tweet.reply_to,
      tweet.mentions,
      tweet.urls,
      tweet.media
    );
  const maybeMedia = (tweet) =>
    tweet.has_media ? renderMedia(tweet.media, 'th-media') : '';
  const maybeQuote = (tweet) =>
    tweet.has_quote ? renderQuote(tweet.quote, tweet.has_media) : '';

  return (
    <div class="p-4 border-b border-borderBg">
      <div class="flex">
        <div class="flex-none mr-3">
          <div class="w-9 h-9">
            <a href={getUserUrl(tweet.username)}>
              <img
                class="rounded-full"
                src={prop('profile_image', tweet) ?? defaultProfilePic}
              />
            </a>
          </div>
        </div>
        <div class="flex-grow">
          <div>
            <div class="flex flex-shrink font-medium text-lsm">
              <div class="flex-initial text-lsm font-bold overflow-ellipsis whitespace-nowrap overflow-hidden"><a href={getUserUrl(tweet.username)}>{tweet.name}</a></div>
              <div class="flex-initial ml-1 text-neutral overflow-ellipsis whitespace-nowrap overflow-hidden"><a href={getUserUrl(tweet.username)}>@{tweet.username}</a></div>
              <div class="px-1 text-neutral">·</div>
              <div class="flex-none text-neutral">
                <a class="hover:underline" href={getTweetUrl(tweet)}>
                  {getTimeDiff(tweet.time)}
                </a>
              </div>
            </div>
            <div class="flex-none">
              <div class="text-neutral">{reply_text}</div>
              {reformattedText(tweet)}
            </div>
            {maybeMedia(tweet)}
            {maybeQuote(tweet)}
          </div>
          <div class="mt-3 max-w-md	flex justify-between text-neutral">
            <div ><ReplyAction tweet={_tweet} /></div>
            <div><RetweetAction tweet={_tweet} /></div>
            <div><LikeAction tweet={_tweet} /></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
    // <div class="th-tweet-container">
    //   <div class="th-tweet">
    //     <div class="th-gutter">
    //       <div class="z-10">
    //         <a href={getUserUrl(tweet.username)}>
    //           <img
    //             class="th-profile"
    //             src={prop('profile_image', tweet) ?? defaultProfilePic}
    //           />
    //         </a>
    //       </div>
    //     </div>
    //     <div class="th-body">
    //       <div class="th-header">
    //         <div class="th-header-name z-10 hover:underline">
    //           <a href={getUserUrl(tweet.username)}>{tweet.name}</a>
    //         </div>
    //         <div class="th-header-username z-10">
    //           <a href={getUserUrl(tweet.username)}>@{tweet.username}</a>
    //         </div>
    //         <div class="th-header-dot">·</div>
    //         <div class="th-header-time">
    //           <a
    //             class="hover:underline th-header-time-link"
    //             href={getTweetUrl(tweet)}
    //           >
    //             {getTimeDiff(tweet.time)}
    //           </a>
    //         </div>
    //       </div>
    //       <div class="th-reply">{reply_text}</div>
    //       <div class="th-text z-10 select-text">{reformattedText(tweet)}</div>
    //       {maybeMedia(tweet)}
    //       {maybeQuote(tweet)}
    //       <div class="th-icons">
    //         <ReplyAction tweet={_tweet} />
    //         <RetweetAction tweet={_tweet} />
    //         <LikeAction tweet={_tweet} />
    //         {/* <div class="th-icon-field">
    //           <div class="th-share-container">
    //             <ShareIcon />
    //           </div>
    //         </div> */}
    //       </div>
    //     </div>
    //   </div>
    //   {isNil(tweet.unavailable) ? (
    //     <div
    //       class="th-hover absolute inset-0 rounded-sm bg-opacity-0 flex items-center justify-center bg-gray-200 hover:cursor-default hover:bg-opacity-70"
    //       onClick={onClick}
    //     >
    //       <textarea
    //         style="display: none"
    //         id={`th-link-${tweet.id}`}
    //         class="th-link"
    //         ref={linkField}
    //       >
    //         {getTweetUrl(tweet)}
    //       </textarea>
    //       <div class="flex flex-col bg-transparent items-center">
    //         <div class="text-base font-medium bg-transparent z-20">
    //           <div class="text-mainBg">{copyText}</div>
    //           {!(isNil(score) || isProduction) && (
    //             <div class="text-green-400">{`score: ${score.toFixed(2)}`}</div>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   ) : (
    //     <UnavailableHover score={score} />
    //   )}
    // </div>
  );
}

const UnavailableHover = ({ score }) => {
  return (
    <div class="absolute inset-0 rounded-sm bg-opacity-0 flex items-center justify-center bg-gray-200 hover:cursor-default hover:bg-opacity-70">
      <div class="flex flex-col items-center z-20 text-base font-medium bg-transparent">
        <div class=" text-red-700 ">{'tweet unavailable'}</div>
        {isNil(score) || process.env.NODE_ENV != 'development' ? null : (
          <div class=" text-green-400">{`score: ${score.toFixed(2)}`}</div>
        )}
      </div>
    </div>
  );
};

const selectComposer = (input: HTMLElement) => {
  if (isNil(input)) return;
  input.focus();
  // https://stackoverflow.com/questions/24115860/set-caret-position-at-a-specific-position-in-contenteditable-div
  // There will be multiple spans if multiple lines, so we get the last one to set caret to the end of the last line.
  // let _span = $(input).find('span[data-text=true]').last()[0];
  let _span = last(Array.from(input.querySelectorAll('span[data-text=true]')));
  // If there's some writing on it, otherwise _span will be undefined
  if (_span != null) {
    var text = _span.firstChild;
    var range = document.createRange();
    range.setStart(text, text.length);
    range.setEnd(text, text.length);
    var sel = window.getSelection();
    sel?.removeAllRanges()!; //ts override of "Object is possibly 'null'."
    sel?.addRange(range)!; //ts override of "Object is possibly 'null'."
  }
};

const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getTimeDiff(time: string | number | Date) {
  let now = new Date();
  let timeDate = new Date(time);
  let diff = now.getTime() - timeDate.getTime(); // In milliseconds.
  let seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  let mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins}m`;
  }
  let hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  let month = shortMonths[timeDate.getMonth()];
  let day = timeDate.getDate();
  let thisYear = new Date(now.getFullYear(), 0);
  return timeDate > thisYear
    ? `${month} ${day}`
    : `${month} ${day}, ${timeDate.getFullYear()}`;
}

function getReplyText(reply_to, mentions: string | any[]) {
  if (reply_to === null) {
    return '';
  } else if (mentions.length === 1 || mentions.length === 0) {
    return `Replying to @${reply_to}`;
  }

  // Count number of mentions that occur at the beginning of the tweet. Begin at -1 because mentions
  // will include reply_to.
  let numOthers = -1;
  let nextIndex = 0;
  for (var mention of mentions) {
    if (mention.indices[0] !== nextIndex) {
      break;
    }
    numOthers++;
    nextIndex = mention.indices[1] + 1;
  }
  let otherWord = numOthers === 1 ? 'other' : 'others';
  return `Replying to @${reply_to} and ${numOthers} ${otherWord}`;
}

function replaceBetween(
  originalString: string,
  start: number,
  end: number,
  replacement: string
) {
  return (
    originalString.substr(0, start) + replacement + originalString.substr(end)
  );
}

function reformatText(
  text,
  reply_to = null,
  _mentions = null,
  urls = null,
  media = null
) {
  const mentions = defaultTo([], _mentions);
  let ret = text;
  let charsRemoved = 0;
  // Cut out reply_to + any mentions at the beginning.
  if (reply_to !== null) {
    let nextIndex = 0;
    for (var mention of mentions) {
      if (mention.indices[0] !== nextIndex) {
        break;
      }
      // Plus one to get rid of the space between usernames.
      ret = replaceBetween(
        ret,
        mention.indices[0] - charsRemoved,
        mention.indices[1] - charsRemoved + 1,
        ''
      );
      charsRemoved += mention.indices[1] - mention.indices[0] + 1;
      nextIndex = mention.indices[1] + 1;
    }
  }
  if (urls !== null) {
    for (var url of urls) {
      if (url.expanded.includes('https://twitter.com')) {
        ret = ret.replace(url.current_text, '');
      } else {
        ret = ret.replace(url.current_text, url.display);
      }
    }
  }
  if (media !== null) {
    for (var m of media) {
      ret = ret.replace(m.current_text, '');
    }
  }

  return ret;
}

function renderMedia(media: string | any[], className: string) {
  // let topImgs: Element[] = []
  // let botImgs: Element[] = []
  let topImgs: JSX.Element[] = [];
  let botImgs: JSX.Element[] = [];
  if (media.length > 0) {
    topImgs.push(
      <div class="th-media-image">
        <img src={media[0].url} />
      </div>
    );
  }
  if (media.length > 1) {
    topImgs.push(
      <div class="th-media-image">
        <img src={media[1].url} />
      </div>
    );
  }
  if (media.length > 2) {
    botImgs.push(
      <div class="th-media-image">
        <img src={media[2].url} />
      </div>
    );
  }
  if (media.length > 3) {
    botImgs.push(
      <div class="th-media-image">
        <img src={media[3].url} />
      </div>
    );
  }

  let top = <div class="th-media-top">{topImgs}</div>;
  let bottom =
    botImgs.length <= 0 ? '' : <div class="th-media-bottom">{botImgs}</div>;

  return (
    <div class={className}>
      {top}
      {bottom}
    </div>
  );
}

function renderQuote(quote: thTweet, parent_has_media) {
  if (quote != null) {
    let timeDiff = getTimeDiff(quote.time);
    let replyText = getReplyText(quote.reply_to, quote.mentions);
    try {
      replyText = getReplyText(quote.reply_to, quote.mentions);
    } catch (e) {
      console.log('ERROR [getReplyText]', { e, quote });
    }
    let text = reformatText(
      quote.text,
      quote.reply_to,
      quote.mentions,
      null,
      quote.media
    );
    let minimedia: string | JSX.Element = '';
    let mainmedia: string | JSX.Element = '';
    if (quote.has_media) {
      if (parent_has_media) {
        minimedia = renderMedia(quote.media, 'th-quote-content-minimedia');
      } else {
        mainmedia = renderMedia(quote.media, 'th-quote-content-main-media');
      }
    }
    let template = (
      <div class="th-quote">
        <div class="th-quote-header">
          <img
            class="th-quote-header-profile"
            src={prop('profile_image', quote) ?? defaultProfilePic}
          />
          <div class="th-quote-header-name">{quote.name}</div>
          <div class="th-quote-header-username">@{quote.username}</div>
          <div class="th-header-dot">·</div>
          <div class="th-quote-header-time">
            <a
              class="hover:underline th-quote-header-time-link"
              href={getTweetUrl(quote)}
            >
              {timeDiff}
            </a>
          </div>
        </div>
        <div class="th-quote-reply">{replyText}</div>
        <div class="th-quote-content">
          {minimedia}
          <div class="th-quote-content-main">
            <div class="th-text">{text}</div>
            {mainmedia}
          </div>
        </div>
      </div>
    );
    return template;
  } else {
    let template = (
      <div class="th-quote th-unavailable">
        <div class="th-quote-content">
          <div class="th-quote-content-main">
            <div class="th-quote-content-main-text">
              This Tweet is unavailable.
            </div>
          </div>
        </div>
      </div>
    );
    return template;
  }
}

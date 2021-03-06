import { Fragment, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { defaultTo, either, isEmpty, isNil, map } from 'ramda'; // Object
import { validateTweet } from '../../bg/tweetImporter';
import { useStorage } from '../../hooks/useStorage';
import { extractTweetPropIfNeeded } from '../../bg/bgUtils';
import Tooltip from '../common/Tooltip';
import { enqueueStg } from '../../stg/dutils';
import { enqueueEvent } from '../../utils/ga';

const archiveTooltip = (
  <>
    <a
      class="underline hover:opacity-80"
      // class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
      style="color: var(--accent-color)"
      href="https://twitter.com/settings/your_twitter_data"
    >
      {'Download an archive of your data'}
    </a>
    {', extract it and select data/tweet.js.'}
  </>
);

const statusReducer = (state, action) => {
  console.log('statusReducer', { state, action });
  switch (action) {
    case 'idle':
      return 'idle';
    case 'failed':
      return 'failed';
    case 'waiting':
      return 'waiting';
    case 'empty':
      return state === 'waiting' ? 'success' : 'idle';
    // case 'success': return <span>'Archive Loaded!'</span>;
    default:
      throw new Error('Unexpected action');
  }
};
const statusMsg = {
  idle: null,
  failed: (
    <span class="text-red-600 ml-8">
      This file isn't supported. Try another.
    </span>
  ),
  waiting: 'Loading archive...',
  success: 'Archive Loaded!',
};

export const ArchiveUploader = (props) => {
  const [hasArchive, setHasArchive] = useStorage('hasArchive', false);
  const [tempArchive, setTempArchive] = useStorage('queue_tempArchive', null);
  // Create a reference to the hidden file input element
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [status, dispatchMsg] = useReducer(statusReducer, 'idle');

  const buttonClass =
    'rounded text-md text-mainTxt inline bg-hoverBg hover:bg-hoverBg hover:text-twitterGray px-1';

  const LoadArchiveIcon = () => {
    return (
      <div class="inline-flex">
        {/* <Tooltip content={archiveTooltip} direction="bottom"> */}
        <button class={buttonClass}>
          {/* <button class="underline text-md text-mainTxt hover:text-twitterGray"> */}
          Upload Twiter archive
        </button>
        {/* </Tooltip> */}
        <div class="ml-8 text-lsm">{statusMsg[status]}</div>
      </div>
    );
  };

  useEffect(() => {
    console.log('ArchiveUploader', { tempArchive });
    if (either(isNil, isEmpty)(tempArchive)) {
      dispatchMsg('idle');
    }
    return () => {};
  }, [tempArchive]);

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = (event) => {
    console.log('load archive clicked');
    hiddenFileInput.current.click();
  };
  // Call a function (passed as a prop from the parent component)
  // to handle the user-selected file

  // const handleChange = (e: { target: { files: any; }; }) => {
  const handleChange = (e: Event) => {
    const files: FileList = (e.target as HTMLInputElement).files as FileList;

    console.log('arch files', files);
    const reader = new FileReader();
    try {
      reader.onload = importArchive;
      console.log('arch file list', { files });
      const file = files[0];
      console.log('arch file', { file });
      reader.readAsText(file);
    } catch (e) {
      dispatchMsg('failed');
      console.error("ERROR: Couldn't load archive");
      // csException("Couldn't load archive", false);
    }
  };

  // Parses json and stores in temp to be processed by BG
  function importArchive(this: any) {
    const result = this.result.replace(/^[a-z0-9A-Z\.]* = /, '');
    let importedTweetArchive = [];
    try {
      importedTweetArchive = JSON.parse(result);
      importedTweetArchive.forEach((t) => {
        if (!validateTweet(extractTweetPropIfNeeded(t))) throw 'invalid tweets';
      });
    } catch (error) {
      console.error(error);
      dispatchMsg('failed');
      return;
    }

    enqueueEvent(
      'settings',
      'load archive',
      'load archive',
      defaultTo(0, importedTweetArchive.length)
    );
    // csEvent(
    //   'User',
    //   'Loaded Archive',
    //   defaultTo(0, importedTweetArchive.length)
    // );

    console.log('setting archive', importedTweetArchive);
    dispatchMsg('waiting');
    enqueueStg(
      'queue_tempArchive',
      map(extractTweetPropIfNeeded, importedTweetArchive)
    );
    setHasArchive(true);
    hiddenFileInput.current.value = null;
    // setStg(
    //   'temp_archive',
    //   map(extractTweetPropIfNeeded, importedTweetArchive)
    // ).then(() => {
    //   setHasArchive(true);
    //   // msgBG({ type: 'temp-archive-stored' });
    //   hiddenFileInput.current.value = null;
    // });
  }
  return (
    <div onClick={handleClick}>
      <LoadArchiveIcon />
      <input
        type="file"
        accept=".json,.js"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

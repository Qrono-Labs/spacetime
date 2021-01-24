import { h } from 'preact';
import { AccountsButton } from './Accounts';
import { SearchBar } from './SearchBar';
import { SettingsButton } from './Settings';

export function Header() {
  return (
    <div>
      <div class="header">
        {/* <SyncIcon/> */}
        <div class="title-container">
          <span class="th-title">Thread Helper</span>
          <span class="version text-gray-500">{` v${process.env.VERSION}`}</span>
        </div>
        {process.env.NODE_ENV == 'development' ? <SearchBar /> : null}
        <AccountsButton />
        {/* {!hasArchive ? <ArchiveUploader /> : null} */}
        <SettingsButton />
      </div>
    </div>
  );
}
//

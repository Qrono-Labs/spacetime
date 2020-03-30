"use strict";
$(document).ready(function() {
  $("#authButton").click(function() {
    chrome.tabs.query({ currentWindow: true, active: true }, sendToBackground);
    function sendToBackground(tabs) {
      chrome.runtime.sendMessage({ type: "auth", tabId: tabs[0].id }, () =>
        console.log("auth complete")
      );
    }
  });
  // TODO: You shouldn't be able to click download until you have an auth
  $("#downloadButton").click(function() {
    const username = $("#username").val();
    chrome.runtime.sendMessage({
      type: "load",
      username: username,
      since: "2020-03-01",
      until: "2020-03-31"
    });
  });
  $("#clearButton").click(function() {
    chrome.runtime.sendMessage({ type: "clear" });
  });
});

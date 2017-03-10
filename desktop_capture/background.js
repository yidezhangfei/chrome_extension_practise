// Copyright 2013 The Chromium Authors. All rights reserved.

chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create("index.html", {
        bounds: [
            width: 1080,
            height: 550
        ]
    })
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    chrome.desktopCapture.shooseDesktopMedia(
        ["screen", "window"],
        function(id) {
            sendResponse({
                "id": id
            })
        }
    )
})
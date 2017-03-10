// Copyright The Chromium Authors. All rights reversed.

'use strict';

const DESKTOP_MEDIA = ['screen', 'window', 'tab', 'audio'];

var pending_request_id = null;
var pc1 = null;
var pc2 = null;

// Launch the chooseDesktoMedia().
document.querySelector("#start").addEventListener('click', function(event) {
    pending_request_id = chrome.desktopCapture.chooseDesktopMedia(
        DESKTOP_MEDIA, onAccessApproved
    )
});

document.querySelector("#cancel").addEventListener(function(event) {
    if (pending_request_id != null) {
        chrome.desktopCapture.cancelShooseDesktopMedia(pending_request_id)
    }
});

document.querySelector("#startFromBackgroundPage").addEventListener(function(event) {
    chrome.runtime.sendMessage(
        {}, function(response) {
            console.log(response.farewell);
        }
    )
});

// Lanch webkitGetUserMedia() based on selected media id.
function onAccessApproved(id, options) {
    if (!id) {
        console.log('Access rejected.')
        return
    }

    var audioConstraint = {
        mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: id
        }
    }

    console.log(options.canRequestAudioTrack)
    if (!options.canRequestAudioTrack)
        audioConstraint = false

    navigator.webkitGetUserMedia({
        audio: audioContraint,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: id,
                maxWidth: screen.width,
                maxHeight: screen.height
            }, gotStream, getUserMediaError
        }        
    }
    )
}

function getUserMediaError(error) {
    console.log('navigator.webkitGetUserMedia() error', error)
}

// Capture video/audio of media and initialize RTC communication.
function gotStream(stream) {
    console.log('received local stream', stream)
    var video = document.querySelector('video')
    video.src = URL.createObjectURL(stream)
    stream.onened = function() { console.log('ended')}

    pc1 = new RTCPeerConnection()
    pc1.onicecandidate = function(event) {
        onIceCandidate(pc1, event)
    }
    pc2 = new RTCPeerConnection()
    pc2.onicecandidate = function(event) {
        onIceCandidate(pc2, event)
    }
    pc1.oniceconnectionstatechange = function(event) {
        onIceStateChange(pc1, event)
    }
    pc2.oniceconnectionstatechange = function(event) {
        onIceStateChange(pc2, event)
    }
    pc2.onaddstream = gotRemoteStream
    pc1.addStream(stream)

    pc1.createOffer(onCreateOfferSuccess, function() {})
}

function onCreateOfferSuccess(desc) {
    pc1.setLocalDescription(desc)
    pc2.setRemoteDescription(desc)
    // Since the 'remote' side has no media stream we need 
    // to pass in the right constreaints in order for it to
    // accept the incoming offer of audio and video
    var sdpConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    }
    pc2.createAnswer(onCreateOfferSuccess, function(){}, sdpConstraints)
}

function gotRemoteSteam(event) {
    // Call the polyfill wrapper to attach the media stream to this element.
    console.log('hitting this code')
    remoteVideo.src = URL.createObjectURL(event.stream)
}

function onCreateAnswerSuccess(desc) {
    pc2.setLocalDescription(desc)
    pc1.setRemoteDescription(desc)
}

function onIceCandidate(pc, event) {
    if (event.candidate) {
        var remotePc = (pc == pc1) ? pc2 : pc1
        remotePc.addIceCandidate(new RTCIceCandidate(event.candidate))
    }
}

function onIceStateChange(pc, event) {
    if (pc) {
        console.log('ICE state change event', event)
    }
}

// (c) 2017 TrueVisionSolutions Pty Ltd.
// All rights reserved
// Interface with the AS3 jpeg compressor

var flashVideoFallback = (function() {
  'use strict';

  var minB64Size = 6000; //constant. This is just a check
  var image_ = new Image();
  var flashCamElement, flashCam;
  var width_, height_;
  var successCallback_, frameCallback_;
  var flashWindowHidden_;
  var setup = function(elementId, width, height, successCallback,
    errorCallback) {
    flashCamElement = elementId;
    width_ = width;
    height_ = height;
    successCallback_ = successCallback;
    var flashvars = {};
    var params = {
      'quality': 'high',
      'allowScriptAccess': 'always',
      'scale': 'noscale'
    };
    var attributes = {
      'mayscript': 'true',
      'class': 'flashVideo'
    };

    var swfname = 'jpgencoder.swf';
    swfobject.embedSWF(swfname, flashCamElement, width, height,
      '21.0.0', null, flashvars, params, attributes,
      function(e) {
        if (e.success) {
          setupCaptureFlash();
        } else {
          errorCallback('Error embedding flash. Is flash installed/enabled??');
          // alert('Error embedding flash. Is flash installed/enabled??');
        }
      });
  }

  function setupCaptureFlash() {
    try {
      flashCam = document.getElementById(flashCamElement);
      var ret = flashCam.ccInit(width_, height_);
      flashCam.ccQuality(80);
    } catch (e) {
      setTimeout(setupCaptureFlash, 1000); // try again
      return;
    }
  }

  var onSWFReady = function() {
    successCallback_();
  }

  var grabImage = function(callback) {
    frameCallback_ = callback;
    var ret = flashCam.ccCapture();
    //    console.log('ccCapture = ' + ret);
  }

  var onFrameReady = function(b64jpg) {
    if (!frameCallback_) return;
    //    console.log('b64jpg size: ' + b64jpg.length);
    if (b64jpg.length > minB64Size) {
      if (!flashWindowHidden_) {
        flashCam.style.zIndex = -1;
        flashWindowHidden_ = true;
      }
      image_.onload = function() {
        frameCallback_(image_);
      };
      image_.src = "data:image/jpeg;base64," + b64jpg;
    }
  }

  return {
    setup: setup,
    grabImage: grabImage,
    onSWFReady: onSWFReady,
    onFrameReady: onFrameReady
  }
})();

////////////
//callbacks from flash code. These names are fixed in the AS3 code
function cameraSetup(status) {
  console.log('cameraSetup callback: ' + status.status);
  if (status.success) {
    flashVideoFallback.onSWFReady();
  } else if (status.errorID == 0) {
    //camera opened, let's wait until the user clicks 'Allow'.
  } else {
    //camera couldn't be open or was not allowed - display an error to the user
    console.warn('Error: ' + status.status);
  }
}

function flashErrorCallback(errorID, message) {
  console.log('error: ' + errorID + ' - ' + message);
}

function jpegData(b64jpg) {
  flashVideoFallback.onFrameReady(b64jpg);
}
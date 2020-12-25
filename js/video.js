//code to manage opening and closing a video stream from the camera
/*jshint devel:true*/

var videoSetup = function(video, successCallback, errorCallback) {
  'use strict';
  var cameraStream = null;

  try {
    var readyListener = function(event) {
      video.removeEventListener('loadeddata', readyListener);
      successCallback(video.videoWidth, video.videoHeight, cameraStream, false);
    };

    //we're getting images from the camera
    video.addEventListener('loadeddata', readyListener);

    // var options = {audio: false, video: true};

    // The site can be used to check the support the WebRTC camera resolution:
    // https://webrtchacks.github.io/WebRTC-Camera-Resolution/
    var options = {
      audio: false,
      video: {
        width: vWidth,
        height: vHeight,
      }
    };

    compatibility.getUserMedia(options, function(stream) {
      cameraStream = stream;
      try {
        // video.src = compatibility.URL.createObjectURL(stream);
        vide.srcObject = stream;
      } catch (error) {
        video.src = stream;
        errorCallback('error getting user media: ' + error.name);
      }
      setTimeout(function() {
        video.play();
      }, 500);
    }, function(error) {
      if (error) {
        var errmsg = 'Error opening WebRTC: ';
        // if (message in error) errmsg += error.message;
        // else if (name in error) errmsg += error.name;
        errorCallback(errmsg);
        console.log(errmsg);
        //location.reload();
      }
    });
  } catch (error) {
    errorCallback(error);
  }
};

var videoTear = function(video, cameraStream) {
  video.pause();
  if (cameraStream) {
    var tracks = cameraStream.getVideoTracks();
    for (var t in tracks) {
      tracks[t].stop();
    }
  }
  video.src = '';
};
// (c) 2017 ULSee Ltd.
// All rights reserved

var tracker;
var video, canvas, ctx, canvas3d;
var videoStream = null;
var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
var usesFlash = false,
  visibleFlashWindow = true,
  flashCaptureInterval;
var currentEyewearId = '16f7b2b6-ca80-44ad-b253-80ee1454cb97';
var glassesSize = 135; // Default size of the glasses (mm).
var faceVTO = undefined;
var inputSource = "livecam";
var isDrawingGlasses = true;
var isMirror = false;
var refreshGlasses;
var defaultCanvasWidth = 640;       // Hard code width for image/video tracking.
var defaultCanvasHeight = 480;      // Hard code height for image/video tracking.
var currentFiles = []; // Save name of files that is uploaded by a single user.
var currentURL = window.location.href;
var mainPath, lensPath, rlegPath, llegPath, shadowPath; // Save path of glasses image.
var imageReady = false;
var currentEyewearData;
var saveImg = false;
var browser;
var isStartPD = false;

// Sample cube map image from:
// http://www.humus.name/index.php?page=Textures
// The picture of each face must have the same width and height to make a proper cube. (ex: 512 x 512 pixel. Not too big size or the explorer would show error message.)
var envCubeMap;

var isMobileBrowser = false;

// 2018.06.04 NewWay modified to change resolution of built-in cemera.
// However the higher resolution the more memory using, and it would cause browser crash easily.
// And there is still a vto scale issue. Different camera resolution would get different tracker scale value.
var vWidth = 640, vHeight = 480;

window.onload = function() {
  isMobileBrowser = isMobileDevice();
  console.log( 'isMobileBrowser? (' + isMobileBrowser + ')' );
}


window.addEventListener('load', function() {

  currentURL = checkURL(currentURL);

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // Action to be performed when the document is read;
        var eyewears = JSON.parse(xhttp.responseText);

        var html = '';
        for (var i = 1; i <= eyewears.length; i += 6) {
          html += '<div class="item';
          if (i == 1) {
            html += ' active';
          }
          html += '">';

          for (var j = i; j < i + 6; j++)
          {
            if (j <= eyewears.length)
            {
              html += '<div class="col-md-2 col-sm-2 col-xs-2" style="left: 50%; transform: translateX(-50%);"><label>' + eyewears[j - 1].ref_number + '<br>' + eyewears[j - 1].product_name + '</label>';
              html += '<img value="' + eyewears[j - 1]._id + '" class="';
              if (i == 1 && j == 1) {
                html += 'active';
              }
              html += '" src="images/eyewear_preview/' + eyewears[j - 1].images.preview + '"></div>';
            }
          }
          html += '</div>';
        }
        document.getElementById("content_underside").getElementsByClassName("carousel-inner")[0].innerHTML = html;
      }
  };
  var url = currentURL + 'data/localDiskDb_eyewear6.json';
  xhttp.open("GET", url, false);
  xhttp.send();
  
  // Trigger a click event on the file input.
  document.getElementById("photo").getElementsByTagName("img")[0].addEventListener("click", function() {
    // alert("this function is not supported in demo version");
    inputSource = "photo";
    selectInputSource();
  });

  document.getElementById("video").getElementsByTagName("img")[0].addEventListener("click", function() {
    // alert("this function is not supported in demo version");
    inputSource = "video";
    selectInputSource();
  });

  document.getElementById("livecam").getElementsByTagName("img")[0].addEventListener("click", function() {
    inputSource = "livecam";
    selectInputSource();
  });

  document.getElementById("showHideVTO").addEventListener("click", function() {
    isDrawingGlasses = this.checked;
  });

  document.getElementById("isMirror").addEventListener("click", function() {
    isMirror = this.checked;
  });
  

  // Pause or stop the video/webcam.
  var node;
  node = document.getElementById("stop");
  node.addEventListener("click", function() {
    if (this.value === 'start') {
      if (inputSource == 'video') {
        video.play();
      } else if (inputSource == 'livecam') {
        if (usesFlash) {
          if (!flashCaptureInterval)
            flashCaptureInterval = setInterval(function() {
              flashVideoFallback.grabImage(TrackerUtils.newFrameFromFlash);
            }, 50);
        } else {
          video.play();
        }
      }
      this.value = 'pause';
      this.innerHTML = '<span class="glyphicon glyphicon-pause" aria-hidden="true"></span> Pause';

    } else if (this.value === 'pause') {
      if (inputSource == 'video') {
        video.pause();
      } else if (inputSource == 'livecam') {
        if (usesFlash) {
          if (flashCaptureInterval) clearInterval(flashCaptureInterval);
          flashCaptureInterval = null;
        } else {
          video.pause();
        }
      }

      this.value = 'start';
      this.innerHTML = '<span class="glyphicon glyphicon-play" aria-hidden="true"></span> Start';
    }
  });
  

  node = document.getElementById("saveSettings");
  node.addEventListener("click", function() {
    currentEyewearData.settings.transparency = document.getElementById("glassesTransparencySlider").value;
    currentEyewearData.settings.shadow = document.getElementById("frontShadowTransparencySlider").value;
    currentEyewearData.settings.temples = document.getElementById("glassesTemplesSlider").value;
    currentEyewearData.settings.scale = document.getElementById("glassesScaleSlider").value;

    alert('setting is output in console');
    console.log(currentEyewearData);
  });

  // Update glasses image when a users select a pair of glasses.
  for(var inode = 0; inode < document.getElementById("glasses-selection").getElementsByTagName("img").length; inode++)
  {
    document.getElementById("glasses-selection").getElementsByTagName("img")[inode].addEventListener("click", function(){
      for(var itmp = 0; itmp < document.getElementById("glasses-selection").getElementsByTagName("img").length; itmp++)
      {
        document.getElementById("glasses-selection").getElementsByTagName("img")[itmp].classList.remove('active');
      }
      this.classList.add('active');

      currentEyewearId = this.getAttribute('value');

      setImage(currentEyewearId);

      var waitForImageReady = function() {
        if (imageReady != true) {
          setTimeout(waitForImageReady, 100);
        } else {
          imageReady = false;

          var isOptical = (currentEyewearData.isOpticalLens==undefined) ? false : currentEyewearData.isOpticalLens;
          var path = 'images/eyewear_';
          faceVTO.setGlassesImage(
            isOptical,
            path + 'frame/' + currentEyewearData.images.frame, path + 'lenses/' + currentEyewearData.images.lenses,
            path + 'rleg/' + currentEyewearData.images.rleg, path + 'lleg/' + currentEyewearData.images.lleg,
            path + 'shadow/' + currentEyewearData.images.shadow, 'images/footshadow.png', envCubeMap, currentEyewearData.size
          );
          setEyewearAttribute();
        }
      }
      waitForImageReady();
    });
  }

  node = document.getElementById("download");
  node.addEventListener("click", function() {
    saveImg = true;
  });

  pdButton = document.getElementById("pdCalculate");
  pdButton.addEventListener("click", function() {
    isStartPD = !isStartPD;
    if( tracker != null )
        tracker.startPDCalculate(isStartPD);

    if( isStartPD === true )
        pdButton.innerHTML = 'STOP PD';
    else
        pdButton.innerHTML = 'START PD';
  });

  checkloading("js/tracker_js.js");
});

function checkURL(currentURL) {
  if (currentURL.substr(-1) != '/') {
    currentURL = currentURL.substring(0, currentURL.lastIndexOf('/') + 1)
  }
  return currentURL;
}

// Send the Id of the eyewear you want to draw to the server. 
// If the request succeeds, server would response the filename of all the elements required to draw the eyewear.
function setImage(eyewear_id) {
  var bEyewearFound = false;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        // Action to be performed when the document is read;
        var res = JSON.parse(xhttp.response);
        
        res.forEach(function (element)
        {
          if (element._id == eyewear_id)
          {
            // eyewear found
            bEyewearFound = true;
            currentEyewearData = element;

            document.getElementById("glassesTransparencySlider").value = element.settings.transparency;
            document.getElementById("frontShadowTransparencySlider").value = element.settings.shadow;
            document.getElementById("glassesTemplesSlider").value = element.settings.temples;
            document.getElementById("glassesScaleSlider").value = element.settings.scale;

            var bMapFound = false;

            var xhttp_envmap = new XMLHttpRequest();
            xhttp_envmap.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                  // Action to be performed when the document is read;
                  var res2 = JSON.parse(xhttp_envmap.responseText);
                  
                  res2.forEach(function(element2)
                  {
                    if (element.envMap_id == element2._id)
                    {
                      // envMap found
                      bMapFound = true;

                      envCubeMap = {
                        positiveX: "images/environment-map/posx/" + element2.posx,
                        negativeX: "images/environment-map/negx/" + element2.negx,
                        positiveY: "images/environment-map/posy/" + element2.posy,
                        negativeY: "images/environment-map/negy/" + element2.negy,
                        positiveZ: "images/environment-map/posz/" + element2.posz,
                        negativeZ: "images/environment-map/negz/" + element2.negz
                      };
                    }
                  });
                }
            };
            var url = currentURL + 'data/localDiskDb_envMap.json';
            xhttp_envmap.open("GET", url, false);
            xhttp_envmap.send();

            
            if (bMapFound == false)
            {
              envCubeMap = {
                positiveX: "",
                negativeX: "",
                positiveY: "",
                negativeY: "",
                positiveZ: "",
                negativeZ: ""
              };
            }

            imageReady = true;
          }
        });

        if (bEyewearFound == false)
        {
          console.log( 'res.eyewear === undefined' );
          alert('eyewear not found')
          imageReady = false;
        }
        
        return;
      }
  };
  var url = currentURL + 'data/localDiskDb_eyewear6.json';
  xhttp.open("GET", url, false);
  xhttp.send();

}

function startCapture() {
  if (typeof demoStartCapture != 'undefined' && typeof flashVideoFallback != 'undefined') {
    currenteyewearid = document.getElementById("glasses-selection").getElementsByTagName("img")[0].getAttribute('value');

    if( currenteyewearid == undefined ) {
      currenteyewearid = currentEyewearId;
    } else {
    }

    setImage(currenteyewearid); // Set the default eyewear when website is opened

    demoStartCapture();

  } else {
    console.log('demoStart not ready yet');
    //setTimeout(startCapture, 50);
  }
}

var init3dLensDone = function() {
  // Setting glasses images while loading 3d lens file process is done.
  var isOptical = (currentEyewearData.isOpticalLens==undefined) ? false : currentEyewearData.isOpticalLens;

  var path = 'images/eyewear_';
  
  faceVTO.setGlassesImage(
    isOptical,
    path + 'frame/' + currentEyewearData.images.frame, path + 'lenses/' + currentEyewearData.images.lenses,
    path + 'rleg/' + currentEyewearData.images.rleg, path + 'lleg/' + currentEyewearData.images.lleg,
    path + 'shadow/' + currentEyewearData.images.shadow, 'images/footshadow.png', envCubeMap, currentEyewearData.size
  );
  setEyewearAttribute();
};

function get_gUM(video, browser)
{
  if( isIOS ) {   // For iOS11 Safari Test.
    console.log('isIOS');

    video.setAttribute('controls','');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    var constraints = window.constraints = {
      audio: false,
      video: {
        width : vWidth,
        height : vHeight,
      }
    };

    // Set the html canvas width/height.
    document.getElementById("canvas").setAttribute("width", vWidth);
    document.getElementById("canvas").setAttribute("height", vHeight);

    document.getElementById("canvas3d").setAttribute("width", vWidth);
    document.getElementById("canvas3d").setAttribute("height", vHeight);

    // Set the css sidebody width/height.
    document.getElementById("content").style.width = vWidth;
    document.getElementById("content").style.height = vHeight;

    return window.navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);   
  }
  else
  {
    if( (browser.name === 'Safari' && browser.version < 11) 
        || (browser.name === 'FireFox') || (browser.name === 'Opera') ) 
    {
      return navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }
    else
    {
      var constraints = window.constraints = {
        audio: false,
        video: {
          width : vWidth,
          height : vHeight,
        }
      };

      // Set the html canvas width/height.
      document.getElementById("canvas").setAttribute("width", vWidth);
      document.getElementById("canvas").setAttribute("height", vHeight);

      document.getElementById("canvas3d").setAttribute("width", vWidth);
      document.getElementById("canvas3d").setAttribute("height", vHeight);

      // Set the css sidebody width/height.
      document.getElementById("content").style.width = vWidth;
      document.getElementById("content").style.height = vHeight;

      return window.navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
    }
  }
}

// This function sets up the camera, initializes tracker object with a valid activation key and WebGL setting.
function demoStartCapture() {

  video = document.getElementById("webcam");
  video.crossOrigin = "Anonymous";
  
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext('2d');
  canvas3d = document.getElementById("canvas3d");

  if( isMobileBrowser )
    changeCanvasOrientation();

  browser = get_browser();
  console.log( browser.name +', ' + browser.version );
  
  if (tracker == null) {
    tracker = new ULSFaceTracker();
  }

  var gUM = get_gUM(video, browser);

  faceVTO = new ULSFaceVTO();
  // Initialise WebGL settings after get_gUM() to get the proper video with/video height.
  faceVTO.initGL(canvas3d);
  faceVTO.read3dLenseFile( 'resources/3d_lenses.obj', init3dLensDone );   // init3dLensDone() would be called while 3d_lense.obj is loaded done.

  if (gUM) {
    canvas.style.visibility = 'visible';
    canvas3d.style.visibility = 'visible';
    videoSetup(video, TrackerUtils.setupCapture, function(err) {
      console.log(err);
    });
  } else if (!isIOS) { //try flash
    usesFlash = true;
    flashVideoFallback.setup('flashVideo', 320, 240, TrackerUtils.setupFlashCapture,
      function(err) {
        console.error(err);
        usesFlash = false;
        visibleFlashWindow = true;
      });
  } else {
    alert('This browser is not supported for live camera VTO!');
  }
}

var trackingImage = new Image();
trackingImage.crossOrigin = "Anonymous";

// This function handles three kinds of input sources: photo, video, and live camera (webcam).
function selectInputSource(fileName) {

  // Must put this line here, or the glasses will keep refreshing though the input source does not come from video or webcam.
  clearInterval(refreshGlasses);

  if (tracker != null) {
    tracker.releaseData();
    tracker = null;
    delete tracker;
  }

  /**************************** Input Source: Photo ****************************/
  if (inputSource === "photo") {
    document.getElementById("stop").style.display = 'none';

    if (videoStream != null)
      videoStream.getVideoTracks()[0].stop();

    // Pause the flash camera capture.
    if (usesFlash) {
      if (flashCaptureInterval) clearInterval(flashCaptureInterval);
      flashCaptureInterval = null;
    }

    video.src = '';

    if (tracker == null) {
      tracker = new ULSFaceTracker();
    }

    var isOptical = (currentEyewearData.isOpticalLens==undefined) ? false : currentEyewearData.isOpticalLens;

    var path = 'images/eyewear_';
    faceVTO.setGlassesImage(
      isOptical,
      path + 'frame/' + currentEyewearData.images.frame, path + 'lenses/' + currentEyewearData.images.lenses,
      path + 'rleg/' + currentEyewearData.images.rleg, path + 'lleg/' + currentEyewearData.images.lleg,
      path + 'shadow/' + currentEyewearData.images.shadow, 'images/footshadow.png', envCubeMap, currentEyewearData.size
    );
    setEyewearAttribute();

    trackingImage.onload = function() {
      var w = trackingImage.width;
      var h = trackingImage.height;
      var resizeW = (w * 480) / h;


      if( isMobileBrowser )   // While using image iput, consider as landscape mode setting.
      {
          document.getElementById("content").style.height = "480px";
          // document.getElementById("content").style.width = "640px";

          document.getElementById("canvas").setAttribute("width", 640);
          document.getElementById("canvas").setAttribute("height", 480);

          document.getElementById("canvas3d").setAttribute("width", 640);
          document.getElementById("canvas3d").setAttribute("height", 480);

          document.getElementById("canvasSave").setAttribute("width", 640);
          document.getElementById("canvasSave").setAttribute("height", 480);
      }


      ctx.clearRect(0, 0, defaultCanvasWidth, defaultCanvasHeight);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, defaultCanvasWidth, defaultCanvasHeight);
      ctx.drawImage(trackingImage, 0, 0, w, h, (640 - resizeW) / 2, 0, resizeW, 480); //Fix image height to 480px and align center

      var imgData = ctx.getImageData(0, 0, defaultCanvasWidth, defaultCanvasHeight);

      tracker.setupTracker(defaultCanvasWidth, defaultCanvasHeight);

      tracker.updateAndDraw(imgData, null);

      // Draw eyewear for every 100 milliseconds.
      refreshGlasses = setInterval(drawOnPhoto, 100);
    }

    trackingImage.src = "trackingSamples/emma_watson.jpg";

    /**************************** Input Source: Video ****************************/
  } else if (inputSource === "video") {

    video.src = '';

    if (document.getElementById("stop").value == 'start') {
      document.getElementById("stop").click();
    }
    document.getElementById("stop").style.display = '';

    if (usesFlash) {
      if (flashCaptureInterval) clearInterval(flashCaptureInterval);
      flashCaptureInterval = null;
    }

    if (videoStream != null)
      videoStream.getVideoTracks()[0].stop();

    if (tracker == null) {
      tracker = new ULSFaceTracker();
    }

    video.src = 'trackingSamples/Movie1.mp4';
    video.load();

    if (video.readyState === video.HAS_ENOUGH_DATA) {
      TrackerUtils.setupCapture(defaultCanvasWidth, defaultCanvasHeight, null);
    } else {
      video.addEventListener('canplay', movieReadyToPlay);
    }

    /**************************** Input Source: Live Camera ****************************/
  } else if (inputSource === "livecam") {
    if (document.getElementById("stop").value == 'start') {
      document.getElementById("stop").click();
    }
    document.getElementById("stop").style.display = '';
    video.src = '';
    // video.load();

    var gUM = get_gUM(video, browser);


    if (gUM) {
      if (tracker == null) {
        tracker = new ULSFaceTracker();
      }

      videoSetup(video, TrackerUtils.setupCapture, function(err) {
        console.error(err);
      });
    } else if (!isIOS) { //try flash
      if (tracker == null) {
        tracker = new ULSFaceTracker();
      }

      // Re-start the flash camera capture.
      if (usesFlash) {
        if (!flashCaptureInterval) {
          flashCaptureInterval = setInterval(function() {
            flashVideoFallback.grabImage(TrackerUtils.newFrameFromFlash);
          }, 50);
        }
      }

      tracker.setupTracker(canvas.width, canvas.height);
    } else {
      alert('This browser is not supported for live camera VTO!');
    }
  }

  function loadFile(file_url) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          if (inputSource == 'photo') {
            trackingImage.src = file_url;
          } else if (inputSource == 'video') {
            video.src = file_url;
            video.load();
          }
        }
        else
        {
          console.log("File does not exist.");
        }
    };
    xhttp.open("GET", file_url, true);
    xhttp.send();
  }
}

function drawOnPhoto() {
  if( isMobileBrowser )
  {
    var newCanvas3d = document.getElementById("canvas3d");
    faceVTO.setPortraitMode( false, newCanvas3d );      // While using image iput, consider as landscape mode setting.
  }
  
  faceVTO.drawVTO(isDrawingGlasses, isMirror);
  if (saveImg == true) {
    saveVTOResult();
  }
}

function setEyewearAttribute() {
  setGlassesTransparency(currentEyewearData.settings.transparency);
  setFrontShadowTransparency(currentEyewearData.settings.shadow);
  setGlassesTemples(currentEyewearData.settings.temples);
  setGlassesScale(currentEyewearData.settings.scale);
}

function setGlassesTransparency(x) {
  faceVTO.setGlassesTransparency(x);
}

function setFrontShadowTransparency(x) {
  faceVTO.setFrontShadowTransparency(x);
}

function setGlassesTemples(x) {
  faceVTO.setGlassesTemples(degToRad(x));
}

function setGlassesScale(x) {
  faceVTO.setGlassesScale(x);
}

/* Functions to handle newer getUserMedia */
function handleSuccess(stream) {
  console.log('function handleSuccess(stream)');

  var videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log('Using video device: ' + videoTracks[0].label);
  stream.oninactive = function() {
    console.log('Stream inactive');
  };
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  console.log('function handleError(error)');

  if (error.name === 'ConstraintNotSatisfiedError') {
    errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
        constraints.video.width.exact + ' px is not supported by your device.');
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg('getUserMedia error: ' + error.name, error);
}

function errorMsg(msg, error) {
  // errorElement.innerHTML += '<p>' + msg + '</p>';
  console.log('error msg = ' + msg  );
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}


/***** TrackeUtils functions *****/
var TrackerUtils = TrackerUtils || {};

TrackerUtils.drawPoints = function(points2d, confidence, size) {
  'use strict';
  ctx.save();
  if (!size) size = 3;
  var offset = size / 2;
  size = 2 * offset + 1;

  if (confidence) {
    for (var k = 0, len = points2d.length; k < len; k += 2) {
      var v = (255 * confidence[k / 2]) | 0;
      ctx.fillStyle = 'rgb(' + (255 - v) + ',' + v + ',255)';
      ctx.fillRect(points2d[k] - offset, points2d[k + 1] - offset, size, size);
    }
  } else {
    ctx.fillStyle = 'rgb(255, 0, 0)';
    for (var k = 0, len = points2d.length; k < len; k += 2) {
      ctx.fillRect(points2d[k] - offset, points2d[k + 1] - offset, size, size);
    }
  }

  ctx.restore();
};

TrackerUtils.drawRect = function(x, y, w, h) {
   'use strict';
   ctx.save();
   ctx.strokeStyle = 'rgb(255, 0, 0)';
   ctx.strokeRect(x, y, w, h);
   ctx.restore();
};

TrackerUtils.setupCapture = function(width, height, stream) {
  'use strict';
  videoStream = stream;
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';

  tracker.setupTracker(canvas.width, canvas.height);

  setTimeout(function() {
    video.play();
    compatibility.requestAnimationFrame(TrackerUtils.newFrame);
  }, 200);
};

TrackerUtils.setupFlashCapture = function() {
  'use strict';

  ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'black';

  tracker.setupTracker(canvas.width, canvas.height);
  //make a request for an image, then make further requests from the callback
  flashCaptureInterval = setInterval(function() {
    flashVideoFallback.grabImage(TrackerUtils.newFrameFromFlash);
  }, 50);
}

var lastVideoTime = -1;
var counter = 0,
  accTime = 0.0;
TrackerUtils.newFrame = function(frame) {
  try {
    'use strict';
    var t0 = compatibility.performance.now();

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (video.currentTime === lastVideoTime) {
        compatibility.requestAnimationFrame(TrackerUtils.newFrame);
        return;
      }
      lastVideoTime = video.currentTime;

      var w = video.videoWidth;
      var h = video.videoHeight;
      var resizeW = (w * 480) / h;

      ctx.save();
      if (inputSource == "livecam") {
        ctx.scale(-1.0, 1.0);
        ctx.drawImage(video,
          0.0, 0.0, canvas.width, canvas.height, -canvas.width, 0.0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, w, h, (640 - resizeW) / 2, 0, resizeW, 480);
      }

      ctx.restore();

      if( isStartPD == true )
      {
          ctx.font = "25px Arial";
          ctx.fillStyle = "red";
          ctx.fillText("PD Calculating ... ",250,40);
      }

      if( tracker != null && tracker.getPDValue() > 0 )
      {
          ctx.font = "25px Arial";
          ctx.fillStyle = "red";
          
          var v = tracker.getPDValue();
          v = v.toFixed(2);

          ctx.fillText("PD : "+v+"mm",250,70);
      }

      var imData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var state = tracker.updateAndDraw(imData, pdCalculateDone);

      if( state != 0 )
      {
          if( isStartPD )
          {
              // Drawing the credit card landmarks.
              var cardPts2D = tracker.getCreditCardPoints();
              var cardConf = tracker.getCreditCardConfidence();

              if( cardPts2D != null && cardConf != null )
              {
                  TrackerUtils.drawPoints(cardPts2D, cardConf);

                  // Drawing the magnetic stripe of credit card.
                  var cardW = Math.abs( (cardPts2D[8]-cardPts2D[2]) + (cardPts2D[10]-cardPts2D[4]) ) / 2;
                  var cardH = Math.abs( (cardPts2D[5]-cardPts2D[3]) + (cardPts2D[11]-cardPts2D[9]) ) / 2;
                  TrackerUtils.drawRect(cardPts2D[2], cardPts2D[3], cardW, cardH);
              }
          }
      }

      faceVTO.drawVTO(isDrawingGlasses, isMirror);

      if (saveImg == true) {
        saveVTOResult();
      }

      if (video.ended) {
        return;
      }
    }
    compatibility.requestAnimationFrame(TrackerUtils.newFrame);

    /***** This is for performance checking *****/
    // var t1 = compatibility.performance.now();
    // accTime += (t1 - t0);
    // counter++;
    // if ( counter === 10 ) {
    //   console.log('Processing Time: ' + parseFloat(accTime / 10.0).toFixed(2) + ' ms');
    //   accTime = 0.0;
    //   counter = 0;
    // }

  } catch (e) {
    console.log(e);
  }
}

TrackerUtils.newFrameFromFlash = function(frame) {
  'use strict';

  var t0 = compatibility.performance.now();

  if (visibleFlashWindow) {
    visibleFlashWindow = false;
  }
  ctx.save();
  ctx.scale(-1.0, 1.0);
  ctx.drawImage(frame,
    0.0, 0.0, frame.width, frame.height, -canvas.width, 0.0, canvas.width, canvas.height);
  ctx.restore();
  var imData = ctx.getImageData(0.0, 0.0, canvas.width, canvas.height);
  tracker.updateAndDraw(imData, null);

  faceVTO.drawVTO(isDrawingGlasses, isMirror);

  if (saveImg == true) {
    saveVTOResult();
  }
}

function movieReadyToPlay() {
  video.removeEventListener('canplay', movieReadyToPlay);
  TrackerUtils.setupCapture(video.videoWidth, video.videoHeight, null);
}

// Save VTO result to dataURL format
function saveVTOResult() {
  var canvasSave = document.getElementById("canvasSave");
  var canvasSaveCtx = canvasSave.getContext('2d');
  canvasSaveCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasSaveCtx.drawImage(canvas, 0, 0);
  canvasSaveCtx.drawImage(canvas3d, 0, 0);
  var downloadImg = canvasSave.toDataURL('image/png');
  download(downloadImg);
  saveImg = false;
}


// Download VTO result
function download(downloadImg) {
  var link = document.createElement("a");
  link.download = name;
  link.href = downloadImg;
  document.body.appendChild(link);
  link.click();
  window.open(downloadImg);
  document.body.removeChild(link);
  delete link;
}


document.addEventListener("orientationchange", function(event){
    changeCanvasOrientation();
});

function changeCanvasOrientation() {
    console.log('changeCanvasOrientation');

    // 2018.03.08 NewWay added for iOS 11 Safari using, and support both portrait and landscape mode.
    switch(window.orientation) 
    {  
        case -90: case 90:
            /* Device is in landscape mode */
            console.log('landscape mode');
            document.getElementById("content").style.height = vWidth+"px";
            // document.getElementById("content").style.width = "640px";

            document.getElementById("canvas").setAttribute("width", vWidth);
            document.getElementById("canvas").setAttribute("height", vHeight);

            document.getElementById("canvas3d").setAttribute("width", vWidth);
            document.getElementById("canvas3d").setAttribute("height", vHeight);

            document.getElementById("canvasSave").setAttribute("width", vWidth);
            document.getElementById("canvasSave").setAttribute("height", vHeight);

            if( tracker != null )
              tracker.setupTracker( document.getElementById("canvas").width,
                                    document.getElementById("canvas").height );

            if( typeof faceVTO !== "undefined" ) {
              // faceVTO.initGL( canvas3d );
              var newCanvas3d = document.getElementById("canvas3d");
              faceVTO.setPortraitMode( false, newCanvas3d );
            }

            break;
        default:
            /* Device is in portrait mode */
            console.log('portrait mode');
            document.getElementById("content").style.height = vHeight+"px";
            // document.getElementById("content").style.width = "640px";

            document.getElementById("canvas").setAttribute("width", vHeight);
            document.getElementById("canvas").setAttribute("height", vWidth);

            document.getElementById("canvas3d").setAttribute("width", vHeight);
            document.getElementById("canvas3d").setAttribute("height", vWidth);

            document.getElementById("canvasSave").setAttribute("width", vHeight);
            document.getElementById("canvasSave").setAttribute("height", vWidth);

            if( tracker != null )
              tracker.setupTracker( document.getElementById("canvas").width,
                                    document.getElementById("canvas").height );

            if( typeof faceVTO !== "undefined" ) {
              // faceVTO.initGL( canvas3d );
              var newCanvas3d = document.getElementById("canvas3d");
              faceVTO.setPortraitMode( true, newCanvas3d );
            }

            break; 
    }
}

function pdCalculateDone()
{
    console.log('pdCalculateDone');

    isStartPD = false;

    if( tracker != null )
      tracker.startPDCalculate(false);

    pdButton.innerHTML = 'START PD';
}
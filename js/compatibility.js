/**
 * this code is from all around the web :)
 * if u want to put some credits u are welcome!
 */
var compatibility = (function() {
    "use strict";
    var URL = window.URL || window.webkitURL;

    var requestAnimationFrame = function(callback, element) {
        var requestAnimationFrame =
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame;

        return requestAnimationFrame.call(window, callback, element);
    };

    var cancelAnimationFrame = function(id) {
        var cancelAnimationFrame = window.cancelAnimationFrame ||
            function(id) {
                clearTimeout(id);
            };
        return cancelAnimationFrame.call(window, id);
    };

    var getUserMedia = function(options, success, error) {
        var getUserMedia =
            window.navigator.getUserMedia ||
            window.navigator.mozGetUserMedia ||
            window.navigator.webkitGetUserMedia ||
            window.navigator.msGetUserMedia ||
            function(options, success, error) {
                error(new Error('getUserMedia not supported'));
            };

        return getUserMedia.call(window.navigator, options, success, error);
    };

    var performance = window.performance || {};
    if ('now' in performance === false) {
        var offset = Date.now();
        performance.now = function() {
            return Date.now() - offset;
        };
    }

    return {
        URL: URL,
        performance: performance,
        requestAnimationFrame: requestAnimationFrame,
        cancelAnimationFrame: cancelAnimationFrame,
        getUserMedia: getUserMedia
    };
})();
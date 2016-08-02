var util = require('util'),
    exec = require('child_process').exec,
    applescript = require('applescript'),
    Bluebird = require('bluebird')

// Apple scripts
// ----------------------------------------------------------------------------
/*

 */
var scripts = {
    state: [
        'tell application "Spotify"',
            'set cstate to "{"',
            'set cstate to cstate & "\\"track_id\\": \\"" & current track\'s id & "\\""',
            'set cstate to cstate & ",\\"volume\\": " & sound volume',
            'set cstate to cstate & ",\\"position\\": " & (player position as integer)',
            'set cstate to cstate & ",\\"state\\": \\"" & player state & "\\""',
            'set cstate to cstate & "}"',
            'return cstate',
        'end tell'
    ].join('\n'),
    track: [
        'tell application "Spotify"',
          'set ctrack to "{"',
          'set ctrack to ctrack & "\\"artist\\": \\"" & current track\'s artist & "\\""',
          'set ctrack to ctrack & ",\\"album\\": \\"" & current track\'s album & "\\""',
          'set ctrack to ctrack & ",\\"disc_number\\": " & current track\'s disc number',
          'set ctrack to ctrack & ",\\"duration\\": " & current track\'s duration',
          'set ctrack to ctrack & ",\\"played_count\\": " & current track\'s played count',
          'set ctrack to ctrack & ",\\"track_number\\": " & current track\'s track number',
          'set ctrack to ctrack & ",\\"popularity\\": " & current track\'s popularity',
          'set ctrack to ctrack & ",\\"id\\": \\"" & current track\'s id & "\\""',
          'set ctrack to ctrack & ",\\"name\\": \\"" & current track\'s name & "\\""',
          'set ctrack to ctrack & ",\\"album_artist\\": \\"" & current track\'s album artist & "\\""',
          'set ctrack to ctrack & ",\\"spotify_url\\": \\"" & current track\'s spotify url & "\\""',
          'set ctrack to ctrack & "}"',
        'end tell',
    ].join('\n'),
    volumeUp:
        'tell application "Spotify" to set sound volume to (sound volume + 10)',
    volumeDown:
        'tell application "Spotify" to set sound volume to (sound volume - 10)',
    setVolume:
        'tell application "Spotify" to set sound volume to %s',
    play:
        'tell application "Spotify" to play',
    playTrack:
        'tell application "Spotify" to play track "%s"',
    playTrackInContext:
        'tell application "Spotify" to play track "%s" in context "%s"',
    playPause:
        'tell application "Spotify" to playpause',
    pause:
        'tell application "Spotify" to pause',
    next:
        'tell application "Spotify" to next track',
    previous:
        'tell application "Spotify" to previous track',
    jumpTo:
        'tell application "Spotify" to set player position to %s',
    isRunning:
        'tell application "System Events" to (name of processes) contains "Spotify"',
    isRepeating:
        'tell application "Spotify" to return repeating',
    isShuffling:
        'tell application "Spotify" to return shuffling',
    setRepeating:
        'tell application "Spotify" to set repeating to %s',
    setShuffling:
        'tell application "Spotify" to set shuffling to %s',
    toggleRepeating: [
        'tell application "Spotify"',
          'if repeating then',
            'set repeating to false',
          'else',
            'set repeating to true',
          'end if',
        'end tell'
    ].join('\n'),
    toggleShuffling: [
        'tell application "Spotify"',
          'if shuffling then',
            'set shuffling to false',
          'else',
            'set shuffling to true',
          'end if',
        'end tell'
    ].join('\n')
};

// Apple script execution
// ----------------------------------------------------------------------------

var execScript = function(scriptName, params, callback){
    if (arguments.length === 2 && typeof params === 'function'){
        // second argument is the callback
        callback = params;
        params = undefined;
    }

    // applescript lib needs a callback, but callback is not always useful
    if (!callback) callback = function(){};

    if (typeof params !== 'undefined' && !Array.isArray(params)){
        params = [params];
    }

    var script = scripts[scriptName];

    if (typeof script === 'string'){
        if (typeof params !== 'undefined') script = util.format.apply(util, [script].concat(params));
        return applescript.execString(script, callback);
    } else if (script.file){
        return applescript.execFile(scriptsPath + script.file, callback);
    } else if (Array.isArray(script)){
        return applescript.execString(script, callback);
    }
};

var createJSONResponseHandler = function(callback, flag){
    if (!callback) return null;
    return function(error, result){
        if (!error){
            try {
                result = JSON.parse(result);
            } catch(e){
                console.log(flag, result);
                return callback(e);
            }
            return callback(null, result);
        } else {
            return callback(error);
        }
    };
};

var createBooleanResponseHandler = function(callback){
    return function(error, response) {
        if (!error) {
            return callback(null, response === 'true');
        } else {
            return callback(error);
        }
    }
};

// API
// ----------------------------------------------------------------------------

// Open track

exports.open = function(uri, callback){
    return exec('open "'+uri+'"', callback);
};

exports.playTrack = function(track, callback){
    return execScript('playTrack', track, callback);
};

exports.playTrackInContext = function(track, context, callback){
    return execScript('playTrackInContext', [track, context], callback);
};

// Playback control

exports.play = function(callback){
    return execScript('play', callback);
};

exports.pause = function(callback){
    return execScript('pause', callback);
};

exports.playPause = function(callback){
    return execScript('playPause', callback);
};

exports.next = function(callback){
    return execScript('next', callback);
};

exports.previous = function(callback){
    return execScript('previous', callback);
};

exports.jumpTo = function(position, callback){
    return execScript('jumpTo', position, callback);
};

exports.setRepeating = function(repeating, callback){
    return execScript('setRepeating', repeating, callback);
};

exports.setShuffling = function(shuffling, callback){
    return execScript('setShuffling', shuffling, callback);
};

exports.toggleRepeating = function(callback){
    return execScript('toggleRepeating', callback);
};

exports.toggleShuffling = function(callback){
    return execScript('toggleShuffling', callback);
};

// Volume control

var mutedVolume = null;

exports.volumeUp = function(callback){
    mutedVolume = null;
    return execScript('volumeUp', callback);
};

exports.volumeDown = function(callback){
    mutedVolume = null;
    return execScript('volumeDown', callback);
};

exports.setVolume = function(volume, callback){
    mutedVolume = null;
    return execScript('setVolume', volume, callback);
};

exports.muteVolume = function(callback){
    return execScript('state', createJSONResponseHandler(function(err, state){
        exports.setVolume(0, callback);
        mutedVolume = state.volume;
    }));
};

exports.unmuteVolume = function(callback){
    if (mutedVolume !== null) {
        return exports.setVolume(mutedVolume, callback);
    }
};

// State retrieval

exports.getTrack = function(callback){
    return execScript('track', createJSONResponseHandler(callback, 'track'));
};

exports.getState = function(callback){
    return execScript('state', createJSONResponseHandler(callback, 'state'));
};

exports.isRunning = function(callback) {
    return execScript('isRunning', createBooleanResponseHandler(callback));
};

exports.isRepeating = function(callback){
    return execScript('isRepeating', createBooleanResponseHandler(callback));
};

exports.isShuffling = function(callback){
    return execScript('isShuffling', createBooleanResponseHandler(callback));
};


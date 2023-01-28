// ==UserScript==
// @name         AMQ No Sound During Replay Phase
// @namespace    https://github.com/Hachiman215/AMQ-scripts
// @version      1
// @description  mute sound during replay phase
// @author       Hachiman215
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

new Listener("answer results", data => {
    volumeController.setMuted(true);
    volumeController.adjustVolume();
}).bindListener()

new Listener("play next song", data => {
    volumeController.setMuted(false);
    volumeController.adjustVolume();
}).bindListener()
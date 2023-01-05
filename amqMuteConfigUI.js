// ==UserScript==
// @name         AMQ is muted during a specified or random time
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Only have audio during "x" seconds at specified "y"th second
// @author       Hachiman215
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @require      https://github.com/amq-script-project/AMQ-Scripts/raw/master/gameplay/amqAnswerTimesUtility.user.js

// ==/UserScript==
/* Usage:

write in chat: /muteconfig
Thx to BobTheSheriff, xSardine, Nyamu and Minigamer42 as I mostly looked at their scripts to figure out how to write this
*/


let command = '/muteconfig';
let durat = 0;
let delay = 0;
let isCheating = false;
let isActive = false;
let isRandom = false;
let cont= 0;
let configureMuteWindow
let keydownfunction
let answerInput = document.getElementById('qpAnswerInput');
let muteDevice = document.getElementById("qpVolumeIcon");



function createMuteWindows() {
	configureMuteWindow = new AMQWindow({
        title: "Mute Settings",
        position: {
        	x: 0,
        	y: 34
        },
        width: 350,
        height: 150,
        minWidth: 350,
        minHeight: 150,
        zIndex: 1000,
        resizable: true,
        draggable: true
    });
    configureMuteWindow.close();
    configureMuteWindow.addPanel({
        id: "muteSettingsContainer",
        width: 1.0,
        height: 70
    });
    // create the options tab
    configureMuteWindow.panels[0].panel
        .append($(`<div class="slMuteOptions"></div>`)
            .append($(`<div class="slOptionsContainer"></div>`)
                .append($(`<div class="customCheckbox" style="margin-left: 30px"></div>`)
                    .append($(`<input id="slIsActive" type="checkbox">`)
                        .click(function () {
                            checkGuessTime();
                            let msg="MuteScript is ";
                            if($("#slIsActive").prop("checked")){
                                msg+="ON";
                            }else{
                                msg+="OFF";
                            }
                            printMsg(msg);
                        })
                    )
                    .append(`<label for="slIsActive"><i class="fa fa-check" aria-hidden="true"></i></label>`)
                )
                .append(`<div style="margin-left: 20px;"> On</div>`)
             )
            .append($(`<div class="slOptionsContainer"></div>`)
                .append($(`<div class="customCheckbox" style="margin-left: 30px"></div>`)
                    .append($(`<input id="slIsRandom" type="checkbox">`)
                        .click(function () {
                            ifRandom();
                        })
                    )
                    .append(`<label for="slIsRandom"><i class="fa fa-check" aria-hidden="true"></i></label>`)
                )
                .append(`<div style="margin-left: 20px;">Random</div>`)

            )
        )
        .append($(`<div class="slMuteInputs"></div>`)
            .append($(`<div class="slInputContainer"></div>`)
                .append(`<div class="slInputLabel1" style="margin-left: 25px; margin-right: 8px">Duration:</div>`)
                .append($(`<input class="slInputDuration" id="slMuteDuration" type="number" min="0" value="0" step="0.5" pattern="^\d*(\.\d{0,2})?$">`)
                    .on("input", function (event) {
                        durat = document.getElementById("slMuteDuration").value;
                        if(parseFloat(durat)<0){
                            durat=document.getElementById("slMuteDuration").value=0;
                        }
                        let max_str=document.getElementById("mhPlayLength").value
                        if(parseFloat(durat)>parseFloat(max_str)){
                            durat=document.getElementById("slMuteDuration").value=max_str;
                        }
                        checkGuessTime();
                    })

                )
            )
            .append($(`<div class="slInputContainer"></div>`)
                .append(`<div class="slInputLabel2" style="margin-left: 25px; margin-right: 25px">Delay:   </div>`)
                .append($(`<input class="slInputDelay" id="slMuteDelay" type="number" min="0" value="0" step="0.5" pattern="^\d*(\.\d{0,3})?$">`)
                    .on("input", function (event) {
                        delay = document.getElementById("slMuteDelay").value;
                        if(parseFloat(delay)<0){
                            delay=document.getElementById("slMuteDelay").value=0;
                        }
                        let max_str=document.getElementById("mhPlayLength").value
                        if(parseFloat(delay)>parseFloat(max_str)){
                            delay=document.getElementById("slMuteDelay").value=max_str;
                        }
                        checkGuessTime();
                    })

                )
            )
        );
}

function printMsg(message){
    if (quiz.gameMode !== "Ranked") {
        let oldMessage = gameChat.$chatInputField.val();
        gameChat.$chatInputField.val(message);
        gameChat.sendMessage();
        gameChat.$chatInputField.val(oldMessage);
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ifRandom() {

    isRandom = $("#slIsRandom").prop("checked");
    let max_int=parseInt(document.getElementById("mhPlayLength").value);
    if(isRandom){
        $(".slInputDelay").hide();
        $(".slInputLabel2").hide();
        if(parseFloat(durat)<=5){
            delay=getRandomIntInclusive(0,max_int-5);
        }else{
            delay=getRandomIntInclusive(0,max_int-parseInt(durat));
        }
    }else{
        $(".slInputDelay").show();
        $(".slInputLabel2").show();
    }
}

function checkGuessTime() {
    isActive = $("#slIsActive").prop("checked");
    let max_str=document.getElementById("mhPlayLength").value;
    document.getElementById("slMuteDuration").max=max_str;
    document.getElementById("slMuteDelay").max=max_str;
    let max_val=parseInt(max_str,10);
    if (isActive){
        let message = "";
        let sum=parseFloat(delay)+parseFloat(durat);
        if (sum>max_val){
            message += "Mute Inputs are too high"
            printMsg(message);
            document.getElementById("slIsActive").checked=false;
        }
    }
}

function setup() {
    createMuteWindows();
    new MutationObserver((mutationRecord, mutationObserver) => {
        if (mutationRecord[0].target.hasAttribute('disabled')) return;
        isActive = $("#slIsActive").prop("checked");
        if (isActive && durat >= 0){
            volumeController.setMuted(true);
            volumeController.adjustVolume();
            ifRandom();
            let timer = setTimeout(() => {
                volumeController.setMuted(false);
                volumeController.adjustVolume();
                let timer2 = setTimeout(() => {
                    volumeController.setMuted(true);
                    volumeController.adjustVolume();
                }, (durat) * 1000);
            }, delay * 1000);
        }


    }).observe(answerInput, {attributes: true});

    new MutationObserver((mutationRecord, mutationObserver) => {
        isActive = $("#slIsActive").prop("checked");
        if(isActive){
            cont+=1;
            if(isCheating){ null; }
            else{
                if(cont>4){
                    isCheating=true;
                }
            }
        }
    }).observe(muteDevice, {attributes: true});


    var gameChatInput = document.getElementById("gcInput");
    keydownfunction = (event) => {
        if (event.which !== 13) {
            return;
        }
        if(event.target.value==command) {
            configureMuteWindow.open();
            event.target.value = "";
            event.preventDefault();
        }
    };
    gameChatInput.addEventListener("keydown", keydownfunction);

new Listener("guess phase over", () => {
    isActive = $("#slIsActive").prop("checked");
    isRandom = $("#slIsRandom").prop("checked");
    if(isActive){
        volumeController.setMuted(false);
        volumeController.adjustVolume();
        if(isRandom){
            let currentSong = document.getElementById("qpCurrentSongCount").innerHTML;
            let message = "Song " +currentSong + ": sound in sec " + delay;
            printMsg(message);
        }
    }
}).bindListener()

new Listener("answer results", (results) => {
     isActive = $("#slIsActive").prop("checked");
     if(isActive && isCheating){
         printMsg(" I'M A CHEATER - UNMUTED");
     }
    // reset for next round
    isCheating = false;
    cont=0;
}).bindListener()

new Listener("Room Settings Changed", (changes) => {
	checkGuessTime();
}).bindListener()
    // CSS
    AMQ_addStyle(`
        #muteSettingsContainer {
            border-bottom: 1px solid #6d6d6d;
            border-top: 5px;
        }
        .slMuteOptions {
            width: 120px;
            float: left;
            margin-top: 12px;
        }
        .slMuteInputs {
            min-width: 200px;
            margin-top: 6px;
        }
        .slOptionsContainer {
            padding-top: 4 px;
            padding-bottom: 4px;
        }
        .slInputContainer {
            padding-top: 4 px;
            padding-bottom: 4px;
        }
        .slOptionsContainer > .customCheckbox {
            float: left;
        }
        .slInputContainer > .slInputLabel1 {
            float: left;
        }
        .slInputContainer > .slInputLabel2 {
            float: left;
        }
        .slInputDelay {
            width: 100px;
        }
        .slInputDuration {
            width: 100px;
        }
    `);
}

setup();



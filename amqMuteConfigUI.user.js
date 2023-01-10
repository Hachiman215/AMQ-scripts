// ==UserScript==
// @name         AMQ Mute Config UI
// @namespace    https://github.com/Hachiman215/AMQ-scripts
// @version      1.2
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
inputs:
    duration: length of song that will be played (in seconds)
    delay: sample starts in this second
options:
    random: sample starts in any second except last 4s
    on: turn on/off the script

Considerations:
    - Pls report any problem to Hachiman#9758.
    - Using the script with random guesstime is not possible.
    - Using the script with (delay + duration) longer than guesstime is not possible.
    - Setting negative inputs is not possible

Thx to BobTheSheriff, xSardine, Nyamu and Minigamer42 as I mostly looked at their scripts to figure out how to write this
*/
let command = '/muteconfig';
let durat = 0;
let delay = 0;
let count= 0;
let curr_delay = 0;
let configureMuteWindow
let keydownfunction
let answerInput = document.getElementById('qpAnswerInput');
let muteDevice = document.getElementById("qpVolumeIcon");

let messageinChat=true;

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
                                document.getElementById("slMuteDuration").disabled=true;
                                document.getElementById("slMuteDelay").disabled=true;
                            }else{
                                msg+="OFF";
                                document.getElementById("slMuteDuration").disabled=false;
                                document.getElementById("slMuteDelay").disabled=false;
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
                            if($("#slIsActive").prop("checked")){
                                $("#slIsRandom").prop('checked', !$("#slIsRandom").prop('checked'));
                            }else{
                                if($("#slIsRandom").prop("checked")){
                                    $(".slInputDelay").hide();
                                    $(".slInputLabel2").hide();
                                }else{
                                    $(".slInputDelay").show();
                                    $(".slInputLabel2").show();
                                }
                            }

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
                        let max_str=document.getElementById("mhPlayLength").value;
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
                        let max_str=document.getElementById("mhPlayLength").value;
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
    if((message=="MuteScript is OFF" || message == "MuteScript is OFF") && quiz.gameMode !== "Ranked"){
        let oldMessage = gameChat.$chatInputField.val();
        gameChat.$chatInputField.val(message);
        gameChat.sendMessage();
        gameChat.$chatInputField.val(oldMessage);
        return;
    }
    if (quiz.gameMode !== "Ranked" && messageinChat && !quiz.isSpectator) {
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

function getValDelay() {
    let max_int=parseInt(document.getElementById("mhPlayLength").value);
    if($("#slIsRandom").prop("checked")){
        if(parseFloat(durat)<=5){
            return(getRandomIntInclusive(0,(max_int*1000)-5000));
        }else{
            return(getRandomIntInclusive(0,max_int*1000-parseFloat(durat)*1000));
        }
    }else{
        return(delay*1000);
    }
}

function checkGuessTime() {
    let max_str=document.getElementById("mhPlayLength").value;
    document.getElementById("slMuteDuration").max=max_str;
    document.getElementById("slMuteDelay").max=max_str;
    let rGuessTime= document.getElementById("mhPlayLengthRandomSwitch").className == "switchContainer slider-track active";
    let max_val=parseInt(max_str,10);
    if ($("#slIsActive").prop("checked")){
        let sum=parseFloat(delay)+parseFloat(durat);
        if (sum>max_val){
            printMsg("Mute Inputs are too high");
            document.getElementById("slIsActive").checked=false;
        }
        if(rGuessTime){
            printMsg("Script Not Usable with Random Guess Time");
            document.getElementById("slIsActive").checked=false;
        }
    }
}


function setup() {
    createMuteWindows();
    new MutationObserver((mutationRecord) => {
        if (mutationRecord[0].target.hasAttribute('disabled')) return;
        if ($("#slIsActive").prop("checked") && durat >= 0){
            volumeController.setMuted(true);
            volumeController.adjustVolume();
            curr_delay=getValDelay()
            let timer = setTimeout(() => {
                volumeController.setMuted(false);
                volumeController.adjustVolume();
                let timer2 = setTimeout(() => {
                    volumeController.setMuted(true);
                    volumeController.adjustVolume();
                }, (durat) * 1000);
            }, curr_delay);
        }
    }).observe(answerInput, {attributes: true});

    new MutationObserver((mutationRecordArray) => {
        if($("#slIsActive").prop("checked")){
            let currVol = muteDevice.className;
            if(currVol !="fa fa-volume-off" && !answerInput.disabled){
                count+=1;
                if(count==2){
                    printMsg(" I'M A CHEATER - UNMUTED");
                }
            }
            //printMsg(mutationRecord.oldValue);
        }
    }).observe(muteDevice, {attributes: true, attributeOldValue: true,});


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
    if($("#slIsActive").prop("checked")){
        volumeController.setMuted(false);
        volumeController.adjustVolume();
        if($("#slIsRandom").prop("checked")){
            let currentSong = document.getElementById("qpCurrentSongCount").innerHTML;
            let message = "Song " +currentSong + ": sound in sec " + (curr_delay/1000).toString();
            printMsg(message);
        }
    }
}).bindListener()

new Listener("play next song", data => {
    if($("#slIsActive").prop("checked")){
        if (muteDevice.className === "fa fa-volume-off") { muteDevice.click() };
        count=0;
    }
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



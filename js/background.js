let setting = {
    "image_source": "default",
    "image_longside": "480",
    "hide_cursor": false,
    "auto_switch": true,
    "switch_interval": "2"
}

let filter_list = {
    "edit": false,
    "blur": 0,
    "brightness": 100,
    "contrast": 100,
    "saturate": 100
}

chrome.storage.local.get(["extension", "setting", "filter_list"], (storage) => {
    if (storage.extension != undefined) {
        extension = storage.extension;
    }

    if (storage.setting.image_source != undefined) {
        setting.image_source = storage.setting.image_source;
    }

    if (storage.setting.image_longside != undefined) {
        setting.image_longside = storage.setting.image_longside;
    }

    if (storage.setting.hide_cursor != undefined) {
        setting.hide_cursor = storage.setting.hide_cursor;
    }

    if (storage.setting.auto_switch != undefined) {
        setting.auto_switch = storage.setting.auto_switch;
    }

    if (storage.setting.switch_interval != undefined) {
        setting.switch_interval = storage.setting.switch_interval;
    }

    if (storage.filter_list.edit != undefined && storage.filter_list.edit != false) {
        filter_list.edit = true;

        if (storage.filter_list.blur != undefined) {
            filter_list.blur = storage.filter_list.blur;
        }

        if (storage.filter_list.brightness != undefined) {
            filter_list.brightness = storage.filter_list.brightness;
        }

        if (storage.filter_list.contrast != undefined) {
            filter_list.contrast = storage.filter_list.contrast;
        }

        if (storage.filter_list.saturate != undefined) {
            filter_list.saturate = storage.filter_list.saturate;
        }
    }
});

const canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");

const video = document.createElement("video");
video.muted = true;
video.srcObject = canvas.captureStream();

let interval;
let illustNum;
let illustLength;
let illustList;
let prevIllustUrl;

let img = new Image();

img.addEventListener("load", function () {
    draw(true, this.width, this.height);
});

img.src = "icon/icon128.png";

// キーボードショートカット
chrome.commands.onCommand.addListener(function (command) {
    console.log(command);
    switch (command) {
        case "image_rotate_90_clockwise":
            break;
        case "image_rotate_90_counterclockwise":
            break;
        case "image_flip_horizontal":
            break;
        case "image_flip_vertical":
            break;
    }
});

// Content Scriptと通信
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request.message);

    if (request.message == "showPopupWindow") {
        video.play();
        if (video !== document.pictureInPictureElement) {
            video.requestPictureInPicture();
        } else {
            document.exitPictureInPicture();
        }
    } else {
        illustList = request.message;

        if (illustList[0] !== prevIllustUrl) {
            switchPause(interval);
            illustNum = 0;
            illustLength = illustList.length;

            if (video == document.pictureInPictureElement) {
                img.src = prevIllustUrl = illustList[illustNum];

                if (setting.auto_switch && illustLength > 1 && illustNum < illustLength - 1) {
                    interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
                }

                navigator.mediaSession.setActionHandler('skipad', function () {
                    console.log("click: skipad");
                    let link = document.createElement("a");
                    link.href = canvas.toDataURL("image/png");
                    link.download = "test.png";
                    link.click();
                });

                if (illustLength > 1) {
                    // 画像切り替えの再開 & 中断
                    navigator.mediaSession.setActionHandler('play', function () { });
                    navigator.mediaSession.setActionHandler('pause', function () {
                        if (interval) {
                            console.log("pause");
                            switchPause(interval);
                        } else {
                            console.log("play");
                            if (illustNum < illustLength - 1) {
                                interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
                            } else if (illustNum == illustLength - 1) {
                                illustNum = 0;
                                img.src = illustList[illustNum];
                                interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
                            }
                        }
                    });
                    // 前の画像 & 次の画像
                    navigator.mediaSession.setActionHandler('previoustrack', function () {
                        if (illustNum > 0) {
                            console.log("prevIllust");
                            switchPause(interval);
                            illustNum = --illustNum;
                            img.src = illustList[illustNum];
                        }
                    });
                    navigator.mediaSession.setActionHandler('nexttrack', function () {
                        if (illustNum < illustLength - 1) {
                            console.log("nextIllust");
                            switchPause(interval);
                            illustNum = ++illustNum;
                            img.src = illustList[illustNum];
                        }
                    });
                } else {
                    navigator.mediaSession.setActionHandler('play', null);
                    navigator.mediaSession.setActionHandler('pause', null);
                    navigator.mediaSession.setActionHandler('previoustrack', null);
                    navigator.mediaSession.setActionHandler('nexttrack', null);
                }
            }
        }
    }

    return true;
});

video.addEventListener("enterpictureinpicture", function () {
    if (illustLength > 1) {
        interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
    }
})

video.addEventListener("leavepictureinpicture", function () {
    switchPause(interval);
});

function draw(clear, width, height) {
    if (clear) {
        clearCanvas();
    }

    setCanvas(width, height);
    setFilter();
    drawImg();
}

function clearCanvas(width, height) {
    if (!width) {
        width = canvas.width;
    }

    if (!height) {
        height = canvas.height;
    }

    ctx.clearRect(0, 0, width, height);
}

function setCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
}

function drawImg(x, y) {
    if (!x){
        x = 0;
    }

    if (!y){
        y = 0;
    }
    ctx.drawImage(img, x, y, img.width, img.height);
}

function setFilter() {
    if (filter_list.edit) {
        ctx.filter = `blur(${filter_list.blur}px) brightness(${filter_list.brightness}%) contrast(${filter_list.contrast}%) saturate(${filter_list.saturate}%)`;
    }
}

function switchImage(url, max) {
    if (illustNum < max - 1) {
        illustNum = ++illustNum;
        img.src = url[illustNum];

        if (illustNum == max - 1) {
            switchPause(interval);
            console.log("switchEnd");
        }
    } else {
        switchPause(interval);
        console.log("switchEnd");
    }
}

function switchPause() {
    console.log("clearInterval");
    clearInterval(interval);
    interval = false;
}

// refererの書き換え
function rewriteRequestHeader(details) {
    var Referer = {
        "name": "Referer",
        "value": "https://www.pixiv.net/"
    }

    details.requestHeaders.push(Referer);
    return { requestHeaders: details.requestHeaders };
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteRequestHeader,
    { urls: ["https://i.pximg.net/*"] },
    ["requestHeaders", "extraHeaders", "blocking"]
);

chrome.storage.local.onChanged.addListener(function (object) {
    if (object.setting) {
        let newSetting = object.setting.newValue;
        setting = newSetting;
    }

    if (object.filter_list) {
        let newFilter = object.filter_list.newValue;
        filter_list = newFilter;

        draw(true, img.width, img.height);
    }
});
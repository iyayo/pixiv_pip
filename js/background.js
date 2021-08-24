let setting = {
    image_source: "default",
    image_longside: "480",
    hide_cursor: false,
    auto_switch: true,
    switch_interval: "2",
    ugoira_source: "600x600",
    ugoira_interval: "60",
    ugoira_loop: true,
    custom_button: false,
    button_allocation: "play_pause",
    illust_number: true,
    ugoira_number: false,
    number_location: "top_right",
    number_font: "monospace",
    number_size: 5,
    number_text_color: "#ffffff",
    number_edge_color: "#000000"
}

let filter_list = {
    edit: false,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100
}

chrome.storage.local.get(["setting", "filter_list"], (storage) => {
    for (let key in storage.setting){
        if (storage.setting[key] !== undefined){
            setting[key] = storage.setting[key];
        }
    }

    for (let key in storage.filter_list){
        if (storage.filter_list[key] !== undefined){
            filter_list[key] = storage.filter_list[key];
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
let illustAngle = 0;
let drawLocation;
let horizontal = 1;
let vertical = 1;

let img = new Image();

img.addEventListener("load", function () {
    illustAngle = 0;
    horizontal = vertical = 1;
    draw(true, this.width, this.height);
});

img.src = "icon/icon128.png";

// キーボードショートカット
chrome.commands.onCommand.addListener(function (command) {
    switch (command) {
        case "image_rotate_90_clockwise":
            drawLocation = rotationImage(90);
            setFilter();
            reverseImage();
            drawImg(drawLocation.x, drawLocation.y);
            drawIllustNumber(drawLocation.x, drawLocation.y);
            break;
        case "image_rotate_90_counterclockwise":
            drawLocation = rotationImage(-90);
            setFilter();
            reverseImage();
            drawImg(drawLocation.x, drawLocation.y);
            drawIllustNumber(drawLocation.x, drawLocation.y);
            break;
        case "image_flip_horizontal":
            drawLocation = rotationImage(0);
            setFilter();
            reverseImage("horizontal");
            drawImg(drawLocation.x, drawLocation.y);
            drawIllustNumber(drawLocation.x, drawLocation.y);
            break;
        case "image_flip_vertical":
            drawLocation = rotationImage(0);
            setFilter();
            reverseImage("vertical");
            drawImg(drawLocation.x, drawLocation.y);
            drawIllustNumber(drawLocation.x, drawLocation.y);
            break;
    }
});

// Content Scriptと通信
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    function startInterval(type) {
        switch (type) {
            case "illust":
                interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
                break;

            case "ugoira":
                interval = setInterval(switchImage, setting.ugoira_interval, illustList, illustLength);
                break;
        }
    }

    if (request.message == "showPopupWindow") {
        video.play();
        if (video !== document.pictureInPictureElement) {
            video.requestPictureInPicture();
        } else {
            document.exitPictureInPicture();
        }
    } else if (request.message[0].type == "ugoira_progress"){
        drawUgoiraProgress(request.message[0].value);
    } else {
        illustList = request.message;
        switchPause(interval);
        illustNum = 1;
        illustLength = illustList.length - 1;

        if (video == document.pictureInPictureElement) {
            img.src = illustList[illustNum];

            if (setting.auto_switch && illustLength > 1 && illustNum < illustLength) {
                startInterval(illustList[0].type);
            }


            // カスタムボタン（skipad）
            try {
                if (setting.custom_button) {
                    navigator.mediaSession.setActionHandler('skipad', function () {
                        switch (setting.button_allocation) {
                            case "play_pause":
                                if (interval) {
                                    switchPause(interval);
                                } else {
                                    if (illustNum < illustLength) {
                                        startInterval(illustList[0].type);
                                    } else if (illustNum == illustLength) {
                                        illustNum = 1;
                                        img.src = illustList[illustNum];
                                        startInterval(illustList[0].type);
                                    }
                                }
                                break;
                        
                            case "save":
                                var a = document.createElement("a");
                                a.href = canvas.toDataURL("image/jpeg");
                                a.download =  `${illustList[0].id}_p${illustNum - 1}.jpg`
                                a.click();
                                break;
                        }
                    });
                } else {
                    navigator.mediaSession.setActionHandler('skipad', null);
                }
            } catch (error) {
                console.log(error);
            }            

            if (illustLength > 1) {
                // 画像切り替えの再開 & 中断
                navigator.mediaSession.setActionHandler('play', function () { });
                navigator.mediaSession.setActionHandler('pause', function () {
                    if (interval) {
                        switchPause(interval);
                    } else {
                        if (illustNum < illustLength) {
                            startInterval(illustList[0].type);
                        } else if (illustNum == illustLength) {
                            illustNum = 1;
                            img.src = illustList[illustNum];
                            startInterval(illustList[0].type);
                        }
                    }
                });
                // 前の画像 & 次の画像
                navigator.mediaSession.setActionHandler('previoustrack', function () {
                    if (illustNum > 1) {
                        switchPause(interval);
                        illustNum = --illustNum;
                        img.src = illustList[illustNum];
                    }
                });
                navigator.mediaSession.setActionHandler('nexttrack', function () {
                    if (illustNum < illustLength) {
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

    return true;
});

video.addEventListener("enterpictureinpicture", function () {
    // if (illustLength > 1) {
    //     interval = setInterval(switchImage, setting.switch_interval * 1000, illustList, illustLength);
    // }
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
    drawIllustNumber();
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
    if (!x) {
        x = 0;
    }

    if (!y) {
        y = 0;
    }
    ctx.drawImage(img, x, y, img.width, img.height);
}

function drawIllustNumber(x, y) {
    if (illustList[0].type == "illust" && setting.illust_number == true || illustList[0].type == "ugoira" && setting.ugoira_number == true){
        if (illustLength > 1) {
            if (!x) {
                x = 0;
            }
        
            if (!y) {
                y = 0;
            }
    
            ctx.filter = "none";
            ctx.font = `${(canvas.width + canvas.height) / 100 * setting.number_size}px ${setting.number_font}`;
            ctx.fillStyle = setting.number_text_color;
            ctx.strokeStyle = setting.number_edge_color;
            ctx.lineWidth = "5";
    
            switch (setting.number_location) {
                case "top_left":
                    ctx.textAlign = "start";
                    ctx.textBaseline = "top";
                    ctx.strokeText(`${illustNum}/${illustLength}`, x, y);
                    ctx.fillText(`${illustNum}/${illustLength}`, x, y);
                    break;
            
                case "top_right":
                    ctx.textAlign = "end";
                    ctx.textBaseline = "top";
                    ctx.strokeText(`${illustNum}/${illustLength}`, x + img.width, y);
                    ctx.fillText(`${illustNum}/${illustLength}`, x + img.width, y); 
                    break;
    
                case "bottom_left":
                    ctx.textAlign = "start";
                    ctx.textBaseline = "bottom";
                    ctx.strokeText(`${illustNum}/${illustLength}`, x, y + img.height);
                    ctx.fillText(`${illustNum}/${illustLength}`, x, y + img.height); 
                    break;
    
                case "bottom_right":
                    ctx.textAlign = "end";
                    ctx.textBaseline = "bottom";
                    ctx.strokeText(`${illustNum}/${illustLength}`, x + img.width, y + img.height);
                    ctx.fillText(`${illustNum}/${illustLength}`, x + img.width, y + img.height); 
                    break;
            }    
        }    
    }
}

function drawUgoiraProgress(value) {
    ctx.fillStyle = "#0096fa";
    ctx.fillRect(0, canvas.height - canvas.height / 50, canvas.width * value, canvas.height / 50);
}

function setFilter() {
    if (filter_list.edit) {
        ctx.filter = `blur(${filter_list.blur}px) brightness(${filter_list.brightness}%) contrast(${filter_list.contrast}%) saturate(${filter_list.saturate}%)`;
    }
}

function switchImage(url, max) {
    if (illustNum < max) {
        illustNum = ++illustNum;
        img.src = url[illustNum];

        if (illustList[0].type == "illust" && illustNum == max) {
            switchPause(interval);
        } else if (illustList[0].type == "ugoira" && illustNum == max && setting.ugoira_loop) {
            illustNum = 0;
        }
    } else {
        if (illustList[0].type == "ugoira" && setting.ugoira_loop && illustNum == max) {
            illustNum = 0;
        } else {
            switchPause(interval);
        }
    }
}

function switchPause() {
    clearInterval(interval);
    interval = false;
}

function rotationImage(angle) {
    if (Math.abs(illustAngle) == 360) {
        illustAngle = 0;
    }

    illustAngle = illustAngle + angle;

    clearCanvas();

    if (angle == 0) {
        setCanvas(canvas.width, canvas.height);
    } else {
        setCanvas(canvas.height, canvas.width);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(illustAngle * Math.PI / 180);

    switch (Math.abs(illustAngle)) {
        case 90:
            return { "x": -canvas.height / 2, "y": -canvas.width / 2 };
            break;

        case 270:
            return { "x": -canvas.height / 2, "y": -canvas.width / 2 };
            break;

        case 0:
            return { "x": -canvas.width / 2, "y": -canvas.height / 2 };
            break;

        case 180:
            return { "x": -canvas.width / 2, "y": -canvas.height / 2 };
            break;

        case 360:
            return { "x": -canvas.width / 2, "y": -canvas.height / 2 };
            break;
    }
}

function reverseImage(dir) {
    if (dir == "horizontal") {
        switch (horizontal) {
            case 1:
                horizontal = -1;
                break;

            case -1:
                horizontal = 1;
                break;
        }
    } else if (dir == "vertical") {
        switch (vertical) {
            case 1:
                vertical = -1;
                break;

            case -1:
                vertical = 1;
                break;
        }
    }

    ctx.scale(horizontal, vertical);
}

// refererの書き換え
function rewriteRequestHeader(details) {
    var Referer = {
        name: "Referer",
        value: "https://www.pixiv.net/"
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
        setting = object.setting.newValue;
    }

    if (object.filter_list) {
        filter_list = object.filter_list.newValue;

        drawLocation = rotationImage(0);
        setFilter();
        reverseImage();
        drawImg(drawLocation.x, drawLocation.y);
        drawIllustNumber(drawLocation.x, drawLocation.y);
    }
});
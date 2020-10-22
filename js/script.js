/*
Copyright (C) 2013 Shogo Ichinose
Copyright (C) 2010 August Lilleaas
Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

let setting = {
    "image_source": "default",
    "image_longside": "480",
    "hide_cursor": false,
    "auto_switch": true,
    "switch_interval": "2",
    "ugoira_interval": "60",
    "ugoira_loop": true,
    "custom_button": false,
    "button_allocation": "play_pause"
}

let filter_list = {
    "edit": false,
    "blur": 0,
    "brightness": 100,
    "contrast": 100,
    "saturate": 100
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

window.onload = function () {
    const regex = /c\/.*\/(img-master|custom-thumb)/;
    const regex2 = /(square|custom)/;
    const regex_original = /_(square|custom|master)\d+/;
    const ugoira_regex = /.*うごイラ$/;
    const ugoira_regex2 = /ugoku-illust/;
    let prevSrc;

    document.addEventListener("mouseover", function (event) {
        let url;
        if (event.target.tagName == "IMG") {
            if (prevSrc != event.target.src){
                url = event.target.src;
                if (ugoira_regex.test(event.target.alt) || ugoira_regex2.test(event.target.offsetParent.className)) {
                    prevSrc = event.target.src;
                    url = url.replace(regex, "img-zip-ugoira");
                    url = url.replace(/(square1200.jpg|custom1200.jpg|master1200.jpg)/, "ugoira600x600.zip");
        
                    Zip.inflate_file(url, function (zip) {
                        let urlList = [];
                        let i = 1;
                        let illustId = url.match(/.*\/(\d+)_/)[1];
                        urlList[0] = {
                            "type": "ugoira",
                            "id": illustId
                        };
        
                        for (let key in zip.files) {
                            urlList[i] = "data:image/jpeg;base64," + _arrayBufferToBase64(zip.files[key].inflate());
                            i++;
                        }
        
                        sendMsg(urlList);
                    });
        
                    function _arrayBufferToBase64(buffer) {
                        let binary = '';
                        for (let j = 0; j < buffer.byteLength; j++) {
                            binary += String.fromCharCode(buffer[j]);
                        }
                        return window.btoa(binary);
                    }
        
                } else if (regex.test(url)) {
                    prevSrc = event.target.src;

                    switch (setting.image_source) {
                        case "default":
                            url = url.replace(regex, "c/480x960/img-master");
                            break;

                        case "360x360":
                            url = url.replace(regex, "c/360x360_70/img-master");
                            break;
                        
                        case "600x600":
                            url = url.replace(regex, "c/600x600/img-master");
                            break;
                        
                        case "600x1200":
                            url = url.replace(regex, "c/600x1200_90_webp/img-master");
                            break;
                        
                        case "master":
                            url = url.replace(regex, "img-master");
                            break;

                        case "original":
                            // url = url.replace(regex, "img-original");
                            // url = url.replace(regex_original, "");
                            url = url.replace(regex, "img-master");
                            break;
                    }
        
                    url = url.replace(regex2, "master");

                    let illustId = url.match(/.*\/(\d+)_/)[1];
                    let illustNum = event.target.parentNode.parentNode.querySelector("span:not([class])");
                    let urlList = [];
                    urlList[0] = { 
                        "type": "illust",
                        "id": illustId
                    };
        
                    if (illustNum) {
                        for (let i = 1; i <= illustNum.innerText; i++) {
                            urlList[i] = url.replace("p0", `p${i - 1}`);
                        }
                    } else {
                        urlList[1] = url;
                    }
        
                    sendMsg(urlList);
                }
            }
        }
    });

    function sendMsg(msg){
        chrome.runtime.sendMessage({ message: msg }, function () {});
    }

    chrome.storage.local.onChanged.addListener(function (object) {
        if (object.setting) {
            setting = object.setting.newValue;
        }
    });
};

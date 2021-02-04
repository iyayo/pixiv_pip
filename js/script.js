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
    image_source: "default",
    image_longside: "480",
    hide_cursor: false,
    auto_switch: true,
    switch_interval: "2",
    ugoira_source: "600x600",
    ugoira_interval: "60",
    ugoira_loop: true,
    custom_button: false,
    button_allocation: "play_pause"
}

chrome.storage.local.get(["setting"], (storage) => {
    for (let key in storage.setting){
        if (storage.setting[key] !== undefined){
            setting[key] = storage.setting[key];
        }
    }
});

window.onload = function () {
    const regex = /c\/.*\/(img-master|custom-thumb)/;
    const regex2 = /(square|custom)/;
    const regex_original = /_(square|custom|master)\d+/;
    const backImage_regex = /url\("(.*)"\)/;
    const ugoira_regex = /.*うごイラ$/;
    const ugoira_regex2 = /ugoku-illust/;
    const ugoira_regex3 = /(square1200.jpg|custom1200.jpg|master1200.jpg)/;
    const illustId_regex = /.*\/(\d+)_/;
    let prevSrc;
    let xhr = new XMLHttpRequest();

    document.addEventListener("mouseover", function (event) {
        let url;
        if (event.target.style.backgroundImage){
            xhr.abort();
            url = event.target.style.backgroundImage.match(backImage_regex)[1];
            if (prevSrc != url){
                prevSrc = url;
                if (event.target.nextElementSibling) {
                    sendMsg([{"type": "illust", "id": url.match(illustId_regex)[1]}, convertUrl("illust", url)]);

                    url = convertUrl("ugoira", url);

                    xhr.abort();
                    xhr.open("GET", url);
                    xhr.responseType = "arraybuffer";

                    xhr.onload = function(){
                        let zip = Zip.inflate(new Uint8Array(xhr.response));
                        let urlList = [];
                        let i = 1;
                        let illustId = url.match(illustId_regex)[1];
                        urlList[0] = {
                            "type": "ugoira",
                            "id": illustId
                        };

                        for (let key in zip.files) {
                            urlList[i] = "data:image/jpeg;base64," + _arrayBufferToBase64(zip.files[key].inflate());
                            i++;
                        }

                        sendMsg(urlList);
                    }

                    xhr.onprogress = function(event){
                        sendMsg([{type: "ugoira_progress", value: event.loaded / event.total}]);
                    }

                    xhr.send();
                } else if (regex.test(url)) {
                    xhr.abort();
                    sendMsg(createUrlList("illust", convertUrl("illust", url), event.target));
                }
            }
        } else if (event.target.tagName == "IMG") {
            if (prevSrc != event.target.src){
                url = event.target.src;
                if (ugoira_regex.test(event.target.alt) || ugoira_regex2.test(event.target.offsetParent.className)) {
                    prevSrc = event.target.src;

                    sendMsg([{"type": "illust", "id": url.match(illustId_regex)[1]}, convertUrl("illust", url)]);

                    url = convertUrl("ugoira", url);

                    xhr.abort();
                    xhr.open("GET", url);
                    xhr.responseType = "arraybuffer";

                    xhr.onload = function(){
                        let zip = Zip.inflate(new Uint8Array(xhr.response));
                        let urlList = [];
                        let i = 1;
                        let illustId = url.match(illustId_regex)[1];
                        urlList[0] = {
                            "type": "ugoira",
                            "id": illustId
                        };

                        for (let key in zip.files) {
                            urlList[i] = "data:image/jpeg;base64," + _arrayBufferToBase64(zip.files[key].inflate());
                            i++;
                        }

                        sendMsg(urlList);
                    }

                    xhr.onprogress = function(event){
                        sendMsg([{type: "ugoira_progress", value: event.loaded / event.total}]);
                    }

                    xhr.send();
                } else if (regex.test(url)) {
                    xhr.abort();
                    prevSrc = event.target.src;
                    sendMsg(createUrlList("illust", convertUrl("illust", url), event.target));
                }
            }
        }
    });

    function _arrayBufferToBase64(buffer) {
        let binary = '';
        for (let j = 0; j < buffer.byteLength; j++) {
            binary += String.fromCharCode(buffer[j]);
        }
        return window.btoa(binary);
    }

    function createUrlList(type, url, element){
        if (type == "illust"){
            let illustId = url.match(illustId_regex)[1];
            let illustNum = element.parentNode.parentNode.querySelector("span:not([class])");
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

            return urlList;
        }
    }

    function convertUrl(type, url){
        switch (type) {
            case "illust":
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
                break;
        
            case "ugoira":
                url = url.replace(regex, "img-zip-ugoira");
                switch(setting.ugoira_source){
                    case "600x600":
                        url = url.replace(ugoira_regex3, "ugoira600x600.zip");
                        break;

                    case "1920x1080":
                        url = url.replace(ugoira_regex3, "ugoira1920x1080.zip");
                        break;
                }
                break;
        }
        
        return url;
    }

    function sendMsg(msg){
        chrome.runtime.sendMessage({ message: msg }, function () {});
    }

    chrome.storage.local.onChanged.addListener(function (object) {
        if (object.setting) {
            setting = object.setting.newValue;
        }
    });
};

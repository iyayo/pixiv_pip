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
    image_source: "regular",
    image_longside: "480",
    hide_cursor: false,
    auto_switch: true,
    switch_interval: "2",
    ugoira_source: "600x600",
    ugoira_loop: true,
    custom_button: false,
    button_allocation: "play_pause",
    run_trigger: "mouseenter"
}

chrome.storage.local.get(["setting"], (storage) => {
    for (let key in storage.setting) {
        if (storage.setting[key] !== undefined) {
            setting[key] = storage.setting[key];
        }
    }
});

window.onload = function () {
    let prevSrc;
    let xhr = new XMLHttpRequest();

    const observer = new MutationObserver(() => setEventHandlers());
    const target = document.body;
    const config = { childList: true, subtree: true };
    
    observer.observe(target, config);

    setEventHandlers();

    function setEventHandlers() {
        let artworks = document.querySelectorAll('a[href^="/artworks/"]');

        artworks.forEach(element => {
            if (element.querySelector('img, div[style*="background-image"]') === null && !element.style.backgroundImage) return;

            if (setting.run_trigger === "mouseenter") {
                element.onmouseenter = function (event) {
                    if (prevSrc === event.currentTarget.href) return;
    
                    prevSrc = event.currentTarget.href;
    
                    Promise.resolve()
                        .then(() => getIllustInfo(event.currentTarget.href.split("https://www.pixiv.net/artworks/")[1]))
                        .then(res => {
                            if (setting.image_source === "original") return createUrlList(res.illustType, res.urls.original, res.id, res.pageCount);
                            else if (setting.image_source === "regular") return createUrlList(res.illustType, res.urls.regular, res.id, res.pageCount);
                            else if (setting.image_source === "small") return createUrlList(res.illustType, res.urls.small, res.id, res.pageCount);
                        })
                        .then(msg => sendMsg(msg))
                }
            } else if (setting.run_trigger === "click") {
                element.onclick = function (event) {
                    event.preventDefault();
                    if (prevSrc === event.currentTarget.href) return;
    
                    prevSrc = event.currentTarget.href;
    
                    Promise.resolve()
                        .then(() => getIllustInfo(event.currentTarget.href.split("https://www.pixiv.net/artworks/")[1]))
                        .then(res => {
                            if (setting.image_source === "original") return createUrlList(res.illustType, res.urls.original, res.id, res.pageCount);
                            else if (setting.image_source === "regular") return createUrlList(res.illustType, res.urls.regular, res.id, res.pageCount);
                            else if (setting.image_source === "small") return createUrlList(res.illustType, res.urls.small, res.id, res.pageCount);
                        })
                        .then(msg => sendMsg(msg))
                }
            }
        });
    }

    function _arrayBufferToBase64(buffer) {
        let binary = '';
        for (let j = 0; j < buffer.byteLength; j++) {
            binary += String.fromCharCode(buffer[j]);
        }
        return window.btoa(binary);
    }

    function getIllustInfo(id) {
        return new Promise((resolve, reject) => {
            fetch(`https://www.pixiv.net/ajax/illust/${id}?ref=https://www.pixiv.net/artworks/${id}&lang=ja`)
                .then(res => res.json())
                .then(json => json.body)
                .then(data => resolve(data))
        })
    }

    function createUrlList(illustType, illustUrl, illustId, illustNum) {
        return new Promise((resolve, reject) => {
            xhr.abort();
            
            let urlList = [];
            urlList[0] = {
                "type": "illust",
                "id": illustId
            };

            if (illustType <= 1) {
                if (illustNum) {
                    for (let i = 1; i <= illustNum; i++) {
                        urlList[i] = illustUrl.replace("p0", `p${i - 1}`);
                    }
                } else {
                    urlList[1] = illustUrl;
                }

                resolve(urlList);
            } else if (illustType == 2) {
                sendMsg([{"type": "illust", "id": illustId}, illustUrl]);

                fetch(`https://www.pixiv.net/ajax/illust/${illustId}/ugoira_meta?lang=ja`)
                    .then(res => res.json())
                    .then(json => json.body)
                    .then(data => {
                        xhr.abort();
                        
                        if (setting.ugoira_source === "600x600") xhr.open("GET", data.src);
                        else if (setting.ugoira_source === "1920x1080") xhr.open("GET", data.originalSrc);

                        xhr.responseType = "arraybuffer";

                        xhr.onload = function () {
                            let zip = Zip.inflate(new Uint8Array(xhr.response));
                            let i = 1;
                            urlList[0] = {
                                "type": "ugoira",
                                "id": illustId
                            };

                            for (let key in zip.files) {
                                urlList[i] = ["data:image/jpeg;base64," + _arrayBufferToBase64(zip.files[key].inflate()), data.frames[i-1].delay];
                                i++;
                            }

                            resolve(urlList);
                        }

                        xhr.onprogress = function (event) {
                            sendMsg([{ type: "ugoira_progress", value: event.loaded / event.total }]);
                        }

                        xhr.send();
                    })
            }
        })
    }

    function sendMsg(msg) {
        chrome.runtime.sendMessage({ message: msg }, function () { });
    }

    chrome.storage.local.onChanged.addListener(function (object) {
        if (object.setting) {
            setting = object.setting.newValue;
        }
    });
};

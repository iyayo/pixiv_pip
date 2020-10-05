let extension = true;

let setting = {
    "image_source": "default",
    "image_longside": "480",
    "hide_cursor": false,
    "auto_switch": false,
    "switch_interval": "2000"
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

window.onload = function () {
    const regex = /c\/.*\/(img-master|custom-thumb)/;
    const regex2 = /(square|custom)/;
    const regex_original = /_(square|custom|master)\d+/;
    let angle = 0;
    let horizontal = false;
    let vertical = false;
    let top;
    let left;
    let imgWidth;
    let imgHeight;
    let timeout;
    const thumbnail = document.createElement("div");
    thumbnail.id = "popup_hidden";
    document.body.appendChild(thumbnail);

    function changeImage(url) {
        thumbnail.id = "popup";
        thumbnail.style.background = `url(${url})`;
    }

    function moveImage(width, height, top, left) {
        if (width > height) {
            thumbnail.style.width = setting.image_longside + "px";
            var vheight = Math.trunc((height * (setting.image_longside / width)));
            thumbnail.style.height = vheight + "px";
            thumbnail.style.backgroundSize = `${setting.image_longside}px ${vheight}px`;
            thumbnail.style.top = top - (vheight / 2) + "px";
            thumbnail.style.left = left - (setting.image_longside / 2) + "px";
        } else if (width < height) {
            var vwidth = Math.trunc((width * (setting.image_longside / height)));
            thumbnail.style.width = vwidth + "px";
            thumbnail.style.height = setting.image_longside + "px";
            thumbnail.style.backgroundSize = `${vwidth}px ${setting.image_longside}px`;
            thumbnail.style.top = top - (setting.image_longside / 2) + "px";
            thumbnail.style.left = left - (vwidth / 2) + "px";
        } else {
            thumbnail.style.width = setting.image_longside + "px";
            thumbnail.style.height = setting.image_longside + "px";
            thumbnail.style.backgroundSize = `${setting.image_longside}px ${setting.image_longside}px`;
            thumbnail.style.top = top - (setting.image_longside / 2) + "px";
            thumbnail.style.left = left - (setting.image_longside / 2) + "px";
        }
    }

    function changeFilter(filter_list) {
        if (filter_list == "reset") {
            thumbnail.style.filter = "";
        } else {
            thumbnail.style.filter = `blur(${filter_list.blur}px) brightness(${filter_list.brightness}%) contrast(${filter_list.contrast}%) saturate(${filter_list.saturate}%)`;
        }
    }

    function rotateImage(r) {
        if (r == "reset") {
            angle = 0;
            thumbnail.style.transform = `rotate(${angle}deg)`;
        } else {
            angle = angle + r;

            if (horizontal) {
                if (vertical) {
                    thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1) scaleY(-1)`;
                } else {
                    thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1)`;
                }
            } else {
                if (vertical) {
                    thumbnail.style.transform = `rotate(${angle}deg) scaleY(-1)`;
                } else {
                    thumbnail.style.transform = `rotate(${angle}deg)`;
                }
            }
        }
    }

    function flipImage(direction) {
        if (direction == "reset") {
            horizontal = false;
            vertical = false;
            thumbnail.style.transform = `rotate(${angle}deg)`;
        } else if (direction == "horizontal") {
            if (!horizontal && !vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1)`;
                horizontal = true;
            } else if (!horizontal && vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1) scaleY(-1)`;
                horizontal = true;
            } else if (horizontal && !vertical) {
                thumbnail.style.transform = `rotate(${angle}deg)`;
                horizontal = false;
            } else if (horizontal && vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleY(-1)`;
                horizontal = false;
            }
        } else if (direction == "vertical") {
            if (!horizontal && !vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleY(-1)`;
                vertical = true;
            } else if (horizontal && !vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1) scaleY(-1)`;
                vertical = true;
            } else if (!horizontal && vertical) {
                thumbnail.style.transform = `rotate(${angle}deg)`;
                vertical = false;
            } else if (horizontal && vertical) {
                thumbnail.style.transform = `rotate(${angle}deg) scaleX(-1)`;
                vertical = false;
            }
        }
    }

    if (location.pathname == "/bookmark.php") {
        function removeClass() {
            let classElement = document.querySelectorAll(".work._work");

            classElement.forEach(element => {
                element.classList.remove("work", "_work");
            });
        }

        removeClass();
        const observer = new MutationObserver(removeClass);
        const target = document.querySelector("ul._image-items.no-response.gtm-illust-recommend-zone");
        if (target) {
            observer.observe(target, { childList: true });
        }
    }

    document.addEventListener("mouseover", function (event) {
        if (extension) {
            let url;
            if (event.target.tagName == "IMG") {
                url = event.target.src;
            } else if (event.target.style.backgroundImage) {
                url = event.target.style.backgroundImage.match(/https.*\.jpg/)[0];
            }

            if (regex.test(url)) {
                if (setting.image_source == "default") {
                    url = url.replace(regex, "c/480x960/img-master");

                } else if (setting.image_source == "360x360") {
                    url = url.replace(regex, "c/360x360_70/img-master");

                } else if (setting.image_source == "600x600") {
                    url = url.replace(regex, "c/600x600/img-master");

                } else if (setting.image_source == "600x1200") {
                    url = url.replace(regex, "c/600x1200_90_webp/img-master");

                } else if (setting.image_source == "master") {
                    url = url.replace(regex, "img-master");

                } else if (setting.image_source == "original") {
                    url = url.replace(regex, "img-original");
                    url = url.replace(regex_original, "");
                }

                url = url.replace(regex2, "master");

                let illustNum = event.target.parentNode.parentNode.querySelector("span:not([class])");
                let switchCount = 1;
                let img = new Image();

                let urlList = [];

                if (illustNum){
                    for (let i = 0; i < illustNum.innerText; i++){
                        urlList[i] = url.replace("p0", `p${i}`);
                    }
                } else {
                    urlList[0] = url; 
                }

                console.log(urlList);

                chrome.runtime.sendMessage({message: urlList}, function(response) {
                    console.log(response.farewell);
                });

                const switchImage = function () {
                    url = url.replace(`p${switchCount - 1}`, `p${switchCount}`);
                    img.src = url;

                    switchCount = ++switchCount;
                }

                img.addEventListener("load", function () {
                    imgWidth = this.width;
                    imgHeight = this.height;

                    if (setting.auto_switch && illustNum) {
                        thumbnail.innerText = `${switchCount}/${illustNum.innerText}`;
                        if (switchCount < illustNum.innerText) {
                            timeout = setTimeout(switchImage, setting.switch_interval * 1000);
                        }
                    }
                });

                img.onerror = function () {
                    url = url.replace("jpg", "png");
                    img.src = url;
                }

                //img.src = url;

                if (setting.hide_cursor) {
                    event.target.style.cursor = "none";
                } else {
                    event.target.style.cursor = "pointer";
                }
            }

            event.target.addEventListener("mouseout", function () {
                thumbnail.id = "popup_hidden";
                thumbnail.innerText = "";
                rotateImage("reset");
                flipImage("reset");
                clearTimeout(timeout);
            });
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.command == "image_rotate_90_clockwise") {
            rotateImage(90);
        } else if (request.command == "image_rotate_90_counterclockwise") {
            rotateImage(-90);
        } else if (request.command == "image_flip_horizontal") {
            flipImage("horizontal");
        } else if (request.command == "image_flip_vertical") {
            flipImage("vertical");
        }

        sendResponse("response");
    });

    chrome.storage.local.onChanged.addListener(function (object) {
        if (object.extension) {
            extension = object.extension.newValue;
        }

        if (object.setting) {
            let newSetting = object.setting.newValue;
            setting.image_source = newSetting.image_source;
            setting.image_longside = newSetting.image_longside;
            setting.hide_cursor = newSetting.hide_cursor;
            setting.auto_switch = newSetting.auto_switch;
            setting.switch_interval = newSetting.switch_interval;
        }

        if (object.filter_list) {
            let newFilter = object.filter_list.newValue;
            filter_list.edit = newFilter.edit;
            filter_list.blur = newFilter.blur;
            filter_list.brightness = newFilter.brightness;
            filter_list.contrast = newFilter.contrast;
            filter_list.saturate = newFilter.saturate;
        }
    });
};

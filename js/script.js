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
                // url = url.replace(regex, "img-original");
                // url = url.replace(regex_original, "");
                url = url.replace(regex, "img-master");
            }

            url = url.replace(regex2, "master");

            let illustNum = event.target.parentNode.parentNode.querySelector("span:not([class])");
            let urlList = [];

            if (illustNum) {
                for (let i = 0; i < illustNum.innerText; i++) {
                    urlList[i] = url.replace("p0", `p${i}`);
                }
            } else {
                urlList[0] = url;
            }

            chrome.runtime.sendMessage({ message: urlList }, function () { });
        }
    });

    chrome.storage.local.onChanged.addListener(function (object) {
        if (object.setting) {
            setting = object.setting.newValue;
        }
    });
};

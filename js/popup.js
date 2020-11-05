let filter_list = {
    edit: false,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100
}

window.onload = function () {
    let edit = document.getElementById("edit");
    let range = document.querySelectorAll("input[type=range]");
    let status = document.getElementById("status");
    let reset_button = document.getElementById("reset");
    let pip_button = document.getElementById("pip_button");

    function sample_edit(filter_list) {
        let sample_image = document.getElementById("sample_image");
        status.innerText = `${filter_list.blur}px, ${filter_list.brightness}%, ${filter_list.contrast}%, ${filter_list.saturate}%`;

        sample_image.style.filter = `blur(${filter_list.blur}px) brightness(${filter_list.brightness}%) contrast(${filter_list.contrast}%) saturate(${filter_list.saturate}%)`;
    }

    function restore() {
        chrome.storage.local.get(["filter_list"], function (storage) {
            if (storage.filter_list.edit != undefined) {
                filter_list.edit = storage.filter_list.edit;
                edit.checked = storage.filter_list.edit;
            }

            range.forEach(element => {
                for (var k in storage.filter_list) {
                    if (element.id == k) {
                        if (storage.filter_list[k] != undefined) {
                            filter_list[k] = storage.filter_list[k];
                            element.value = storage.filter_list[k];
                        }
                    }
                }
            });
            sample_edit(filter_list);
        });
    }

    function save(value) {
        chrome.storage.local.set({ "filter_list": value }, function () { });
    }

    function reset() {
        filter_list = {
            edit: edit.checked,
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturate: 100
        }

        range.forEach(element => {
            for (var f in filter_list) {
                if (element.id == f) {
                    element.value = filter_list[f];
                    save(filter_list);
                    sample_edit(filter_list);
                }
            }
        });
    }

    restore();

    reset_button.addEventListener("click", reset);
    
    pip_button.addEventListener("click", function(){
        chrome.runtime.sendMessage({message: "showPopupWindow"}, function() {});
    });

    edit.addEventListener("change", function () {
        filter_list.edit = this.checked;
        save(filter_list);
    });

    range.forEach(element => {
        element.addEventListener("input", function () {
            for (var f in filter_list) {
                if (this.id == f) {
                    filter_list[f] = this.value;
                    save(filter_list);
                    sample_edit(filter_list);
                }
            }
        });
    });
}
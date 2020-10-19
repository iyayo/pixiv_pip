function restore(){
    chrome.storage.local.get(["setting"], (storage) => {
        if (storage.setting.image_source != undefined){
            document.querySelectorAll("#image_source > option").forEach(element => {
                if (element.value == storage.setting.image_source){
                    element.selected = true;
                }
            });
        }

        if(storage.setting.auto_switch != undefined) {
            document.getElementById("auto_switch").checked = storage.setting.auto_switch;
        } else {
            document.getElementById("auto_switch").checked = true;
        }

        if(storage.setting.switch_interval != undefined) {
            document.getElementById("switch_interval").value = storage.setting.switch_interval;
        } else {
            document.getElementById("switch_interval").value = "2";
        }

        if(storage.setting.ugoira_loop != undefined) {
            document.getElementById("ugoira_loop").checked = storage.setting.ugoira_loop;
        } else {
            document.getElementById("ugoira_loop").checked = true;
        }

        if(storage.setting.ugoira_interval != undefined) {
            document.getElementById("ugoira_interval").value = storage.setting.ugoira_interval;
        } else {
            document.getElementById("ugoira_interval").value = "60";
        }

        if(storage.setting.custom_button != undefined) {
            document.getElementById("custom_button").checked = storage.setting.custom_button;
        }

        if (storage.setting.button_allocation != undefined){
            document.querySelectorAll("#button_allocation > option").forEach(element => {
                if (element.value == storage.setting.button_allocation){
                    element.selected = true;
                }
            });
        }
    });
}

function save() {
    let setting = {
        "image_source": document.getElementById("image_source").value,
        "auto_switch": document.getElementById("auto_switch").checked,
        "switch_interval": document.getElementById("switch_interval").value,
        "custom_button": document.getElementById("custom_button").checked,
        "ugoira_loop": document.getElementById("ugoira_loop").checked,
        "ugoira_interval": document.getElementById("ugoira_interval").value,
        "button_allocation": document.getElementById("button_allocation").value
    }

    chrome.storage.local.set({"setting": setting}, function () {
        var status = document.getElementById("status");
        function hide_status(){
            status.style.opacity = 0;
        }

        status.style.opacity = 1;
        timeoutID = window.setTimeout(hide_status, 2000);
    });
}

restore();

document.getElementById("save").addEventListener("click", function () {
    save();
});
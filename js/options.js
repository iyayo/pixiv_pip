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

        if(storage.setting.ugoira_source != undefined) {
            document.querySelectorAll("#ugoira_source > option").forEach(element => {
                if (element.value == storage.setting.ugoira_source){
                    element.selected = true;
                }
            });
        }

        if(storage.setting.ugoira_loop != undefined) {
            document.getElementById("ugoira_loop").checked = storage.setting.ugoira_loop;
        } else {
            document.getElementById("ugoira_loop").checked = true;
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

        if(storage.setting.illust_number != undefined) {
            document.getElementById("illust_number").checked = storage.setting.illust_number;
        }

        if(storage.setting.ugoira_number != undefined) {
            document.getElementById("ugoira_number").checked = storage.setting.ugoira_number;
        }

        if(storage.setting.number_location != undefined) {
            document.querySelectorAll("#number_location > option").forEach(element => {
                if (element.value == storage.setting.number_location){
                    element.selected = true;
                }
            });
        }

        if(storage.setting.number_font != undefined) {
            document.querySelectorAll("#number_font > option").forEach(element => {
                if (element.value == storage.setting.number_font){
                    element.selected = true;
                }
            });
        }

        if(storage.setting.number_size != undefined) {
            document.getElementById("number_size").value = storage.setting.number_size;
        } else {
            document.getElementById("number_size").value = "5";
        }

        if(storage.setting.number_text_color != undefined) {
            document.getElementById("number_text_color").value = storage.setting.number_text_color;
        } else {
            document.getElementById("number_text_color").value = "#ffffff";
        }

        if(storage.setting.number_edge_color != undefined) {
            document.getElementById("number_edge_color").value = storage.setting.number_edge_color;
        } else {
            document.getElementById("number_edge_color").value = "#000000";
        }

        if (storage.setting.run_trigger != undefined) {
            document.querySelector(`option[value=${storage.setting.run_trigger}]`).selected = true;
        }

    });
}

function save() {
    let setting = {
        image_source: document.getElementById("image_source").value,
        auto_switch: document.getElementById("auto_switch").checked,
        switch_interval: document.getElementById("switch_interval").value,
        custom_button: document.getElementById("custom_button").checked,
        ugoira_source: document.getElementById("ugoira_source").value,
        ugoira_loop: document.getElementById("ugoira_loop").checked,
        button_allocation: document.getElementById("button_allocation").value,
        illust_number: document.getElementById("illust_number").checked,
        ugoira_number: document.getElementById("ugoira_number").checked,
        number_location: document.getElementById("number_location").value,
        number_font: document.getElementById("number_font").value,
        number_size: document.getElementById("number_size").value,
        number_text_color: document.getElementById("number_text_color").value,
        number_edge_color: document.getElementById("number_edge_color").value,
        run_trigger: document.getElementById("run_trigger").value
    }

    chrome.storage.local.set({"setting": setting}, function () {});
}

chrome.fontSettings.getFontList(function (result){
    let number_font = document.getElementById("number_font");

    for (let i = 0; i < result.length; i++) {
        let number_font_option = document.createElement("option");
        number_font_option.value = result[i].fontId;
        number_font_option.innerText = result[i].displayName;
        number_font.appendChild(number_font_option);        
    }

    restore();
});

document.querySelectorAll("select, input").forEach(element => {
    element.addEventListener("change", save);
});
const socket = io("http://localhost:8000");

document.getElementById("getLocButton").onclick = () => {
    console.log("requesting streaming locators");
    socket.emit('get_locators', null);
}

document.getElementById("getOldLocsButton").onclick = () => {
    console.log("requesting expired locators");
    socket.emit('get_expired_locs');
}

document.getElementById("populateButton").onclick = () => {
    console.log("requesting a DB population");
    socket.emit('populate_db');
}

document.getElementById("refreshButton").onclick = () => {
    console.log("Requesting a locator refresh");
    socket.emit('refresh_locators');
}

document.getElementById("s_EncodeButton").onclick = () => {
    console.log("Asking politely for a special encode...");
    socket.emit("s_encode");
}

document.getElementById("bigRedButton").onclick = () => {
    console.log("Requesting an environment build 150");
    let val = document.getElementById("targetAsset").value;
    let message = {
        target: val
    }
    message = JSON.stringify(message);
    socket.emit("bigRedButton", message);
}

// Responding events

socket.on('locators_response', data => {
    data = JSON.parse(data);
    console.log(data);
})

socket.on('table_results', data => {
    data = JSON.parse(data);
    console.log(data);
})

socket.on('expired_response', data => {
    data = JSON.parse(data);
    console.log(data);
})

socket.on('job_done', () => {
    console.log("Backend says job done!");
})


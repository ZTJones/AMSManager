//Example server code, sans all the server code.

const admin = require("./script");

const Administrator = new admin();

const io = require('socket.io')(3000, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});

io.on("connection", socket => {
    console.log("Connection established");
    socket.emit('connect-test', "Connection established");

    socket.on('get_locators', async data => {
        console.log("Got request for all streaming locators");
        let results =  await Administrator.getStreamingLocators();
        socket.emit('locators_response', JSON.stringify(results));
    });

    socket.on('get_expired_locs', async data => {
        console.log("Got a request for expired locators");
        let results = await Administrator.getExpiredLocators();
        socket.emit('expired_response', JSON.stringify(results));
    });

    socket.on('refresh_locators', async () => {
        console.log("Got a request to refresh the streaming locators");
        Administrator.remakeAll();
    })

    socket.on('populate_db', async () => {
        console.log("Got a request to populate the DB");
        let results = await Administrator.transferStreamingLocators();
        socket.emit('table_results', JSON.stringify(results));
    });
    
})
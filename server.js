//Example server code, sans all the server code.

const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json(), express.urlencoded({extended: true}));

app.use(cors());
require("./scripts/routes")(app);

const server = app.listen(8000, () => console.log("The server is ready on port 8000"));



const admin = require("./script");

const Administrator = new admin();

const io = require('socket.io')(server);

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
       // Administrator.remakeAll();
       Administrator.refreshExpired();
    })

    socket.on('populate_db', async () => {
        console.log("Got a request to populate the DB");
        let results = await Administrator.transferStreamingLocators();
        socket.emit('table_results', JSON.stringify(results));
    });

    socket.on("s_encode", async () => {
        console.log("Got a request for a special encode.");
        Administrator.encodeWithSaas();
    });

    socket.on("bigRedButton", async () => {
        console.log("Got a request for a 2k locator build");
        Administrator.buildEnvironment();
    })
    
})
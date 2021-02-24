const Controller = require("./controller");
// const indexPage = require("../")
const path = require('path');
const express = require("express");

module.exports = app => {
    app.use(express.static("public"));
    
    app.get("/", Controller.index);

    app.get("/client.js/", Controller.client);

    app.get("/testRun/", Controller.testRun);

}
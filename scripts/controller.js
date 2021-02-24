// No models required

module.exports.testRun = (req, res) => {
    res.json({message: "Server connected."});
}

module.exports.index = (req, res) => {
    console.log("Did we check?");
    res.sendFile("../public/index.html", {root: __dirname});
}

module.exports.client = (req, res) => {
    console.log("Asking for client.js");
    res.sendFile("../public/client.js", {root: __dirname});
}





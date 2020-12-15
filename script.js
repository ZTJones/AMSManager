const MediaServices = require("@azure/arm-mediaservices");
const msRestAzure = require("@azure/ms-rest-azure-js");
const msRest = require("@azure/ms-rest-js");
const msRestNodeAuth = require("@azure/ms-rest-nodeauth");

const resourceGroup = "contractortemp";
const accountName = "zjonestemp";

const subscriptionId = "77961763-d931-4c0f-8579-f7f1980eee92";


let azureMediaServicesClient;

msRestNodeAuth.interactiveLogin().then( async (creds) => {
    azureMediaServicesClient = new MediaServices.AzureMediaServices(creds, subscriptionId);
    let assetList = await azureMediaServicesClient.assets.list(resourceGroup, accountName, {top: 5});
    console.log(assetList);

}).catch((err) => {
    console.error(err);
})

// msRestNodeAuth.loginWithServicePrincipalSecret()
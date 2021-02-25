const uuidv4 = require("uuid/v4");

const MediaServices = require("@azure/arm-mediaservices");
const msRestAzure = require("@azure/ms-rest-azure-js");
const msRest = require("@azure/ms-rest-js");
const msRestNodeAuth = require("@azure/ms-rest-nodeauth");
// const { ConsoleHttpPipelineLogger } = require("@azure/ms-rest-js/es/lib/httpPipelineLogger");

// const mySQL = require('mysql');
const knex = require('knex')({
    client: "mysql",
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: "ams_db"
    }
});


const resourceGroup = "";
const accountName = "";
const aadClientId = "";
const aadSecret = "";
const aadDomain = "";
const subscriptionId = "";


// let azureMediaServicesClient;


// msRestNodeAuth.loginWithServicePrincipalSecret()
module.exports = class Administrator{
    constructor(){
        this.azureMediaServicesClient;

        // This method of connection is faster, and better for testing.
        msRestNodeAuth.loginWithServicePrincipalSecret(aadClientId, aadSecret, aadDomain).then( creds => {
            this.azureMediaServicesClient = new MediaServices.AzureMediaServices(creds, subscriptionId);
            console.log("You are now connected to AMS");
        }).catch((err) => {
            console.error(err);
        })
        
    }

    async getStreamingLocators(){
        let locatorList = await this.azureMediaServicesClient.streamingLocators.list(resourceGroup, accountName);
        let results = [];

        locatorList.forEach(element => {
            results.push(element);
        });
        console.log(results);
        while(locatorList.odatanextLink != undefined){
            console.log(locatorList.odatanextLink);
            locatorList = await this.azureMediaServicesClient.streamingLocators.listNext(locatorList.odatanextLink);
            // console.log(locatorList);
            locatorList.forEach(element => {
                results.push(element);
            });
        }
        
        
        return results;
    }

    async getAllAssets(){
        // This function gets then returns all assets
        let assetList = await this.azureMediaServicesClient.assets.list(resourceGroup, accountName);
        console.log(assetList);
        return assetList;
    }

    async encodeWithSaas(){
        // Encodes an asset with the hidden saasCae preset
        let sourceURL = "https://testerx-zjonestemp-usea.streaming.media.azure.net/addaa4eb-588d-4b9b-9839-2f3c5467051e/m1_03_02_test.mp3";
        let saasTransform = {
            odatatype: "#Microsoft.Media.BuiltInStandardEncoderPreset",
            presetName: "saasCae"
        }
        let encodeName = "saasCaeTransform"
        let transform = await this.azureMediaServicesClient.transforms.get(resourceGroup, accountName, encodeName);
        console.log(transform);
        if(transform.error.code == "NotFound"){
            console.log("Transform didn't exist, making one now")
            transform = await this.azureMediaServicesClient.transforms.createOrUpdate(resourceGroup, accountName, encodeName, {
                name: encodeName,
                location: "East US",
                outputs: [{
                    preset: saasTransform
                }]
            })
        }
        let uniqueness = uuidv4();
        console.log("uniqueness is: " + uniqueness);

        let input = {
            odatatype: "#Microsoft.Media.JobInputHttp",
            files: [sourceURL]
        }
        let outputAssetName = "prefix-output-" + uniqueness;

        let jobName = "prefix-job-" + uniqueness;
        let locatorName = "locator" + uniqueness;
        console.log("creating output asset...");

        let outputAsset = await this.azureMediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, outputAssetName, {})

        console.log("submitting job...");
        // submit input function
        let jobOutputs = [
            {
                odatatype: "#Microsoft.Media.JobOutputAsset",
                assetName: outputAssetName
            }
        ]

        let job = await this.azureMediaServicesClient.jobs.create(resourceGroup, accountName, encodeName, jobName,{
            input: input,
            outputs: jobOutputs
        })
        // end function

        console.log("waiting for job to finish...");
        // we can fill this in later
    }

    async buildEnvironment(targetName = "m4-4-2-mp3-20210028-180901_Output_20210028-181609"){
        let failCount = 0;
        let breakTime = new Date();
        let consecFails = 0;
        breakTime.setMinutes(breakTime.getMinutes() + 5);
        for(let x = 0; x < 150; x++){
            let uniqueness = uuidv4();
            if(consecFails > 10) {
                console.log("Stopping ENV build");
                break;
            }
            try{

                await this.azureMediaServicesClient.streamingLocators.create(resourceGroup, accountName, "locator-" + uniqueness, {
                    streamingPolicyName: "Predefined_ClearStreamingOnly",
                    assetName: targetName, // can now specify on the HTML what asset you want to make locators for
                    endTime: breakTime
                })
                consecFails = 0;
            }catch(er){
                failCount++;
                consecFails++;
                // console.log("FAIL COUNT: " + failCount);
                console.log(er);
                x--;
                continue;
            }
            console.log(x);
        }
        console.log("FINAL FAIL COUNT" + failCount);
    }
    
    async getExpiredLocators(){
        //
        let locatorList = await this.getStreamingLocators();
        // console.log(locatorList);
        let expiredList = [];
        locatorList.forEach(locator => {
            console.log(locator.endTime);
            if(locator.endTime < Date.now()){ // Needs to check ahead of time
                console.log("Expired");
                expiredList.push(locator);
            }else{
                console.log("Not expired");
            }
        });

        return expiredList;
    }

    async transferStreamingLocators(){
        // this function creates DB copies of the streaming locators
        // This call will only return 1000 results at a time
        let locatorList = await this.azureMediaServicesClient.streamingLocators.list(resourceGroup, accountName);
        console.log(locatorList);
        locatorList.forEach( async locator => {
            console.log(locator.streamingPolicyName);
            
            let check = await knex.where("streaming_locator", locator.streamingLocatorId).from('assets')
            if(check != ""){
                console.log("exists");
                console.log("Value of check: " + check);
            }else{
                console.log("doesn't exist");
                console.log("Value of check: " + check);
                knex('assets').insert({
                    asset_id: locator.assetName,
                    streaming_locator: locator.streamingLocatorId
                }).catch(err => {
                    console.log('Insert error: ' + err);
                })
            }
        });
        let all_assets = await knex.select().from('assets');
        console.log(all_assets);
        // iterate through list, checking to see if there's a matching record
        return all_assets;
    }

    async refreshExpired(){
        // this function refreshes the expired streaming locators
        
        let expiredList = await this.getExpiredLocators();
        expiredList.forEach(async locator => {
            let breakTime = new Date();
            // breakTime.setFullYear(breakTime.getFullYear() + 100); // for setting expiry 100 years from now
            breakTime.setMinutes(breakTime.getMinutes() + 5); // for setting expiry 5 minutes from now (TESTING PURPOSES);
            console.log(locator.assetName);
            try{

                await this.azureMediaServicesClient.streamingLocators.deleteMethod(resourceGroup, accountName, locator.name);
                let failed = true;
                while(failed){
                    try{

                        let newLoc = await this.azureMediaServicesClient.streamingLocators.create(resourceGroup, accountName, locator.name, {
                            streamingPolicyName: "Predefined_ClearStreamingOnly",
                            assetName: locator.assetName,
                            streamingLocatorId: locator.streamingLocatorId,
                            endTime: breakTime
                        })
                        failed = false;
                    }catch(er){
                        failed = true;
                        console.log("Error: \n" + er);
                    }
                }
            }catch(er){
                console.log(er);
            }

        });
    }
    // This is a good example of why you test the code. Line 242, locator is not defined.  Will delete all of your locators.
    // async remakeAll(){
    //     let allList = await this.getStreamingLocators();
    //     allList.forEach( async loc => {
    //         await this.azureMediaServicesClient.streamingLocators.deleteMethod(resourceGroup, accountName, loc.name);
    //         await this.azureMediaServicesClient.streamingLocators.create(resourceGroup, accountName, locator.name, {
    //             streamingPolicyName: "Predefined_ClearStreamingOnly",
    //             assetName: locator.assetName,
    //             streamingLocatorId: locator.streamingLocatorId 
    //         })
    //     });
    // }
}
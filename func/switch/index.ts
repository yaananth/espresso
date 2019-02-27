import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { Client, DeviceMethodParams } from "azure-iothub";
import { promisify } from "util";

const deviceId = "espressoPi";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (req.query.on === undefined && req.query.off === undefined) {
        context.res = {
            body: "missing on or off query string",
            status: 404,
        };

        return;
    }
    if (!process.env.APPSETTING_IOTHUB_CONNECTION_STRING) {
        throw new Error("Found no connection string in key vault");
    }
    const client = Client.fromConnectionString(process.env.APPSETTING_IOTHUB_CONNECTION_STRING);

    // remove promisify, after https://github.com/Azure/azure-sdk-for-node/issues/3369
    // and https://github.com/Azure/azure-iot-sdk-node/issues/362 are solved
    // (planed by 22102018 (https://github.com/Azure/azure-sdk-for-node/milestone/35)
    const invokeDeviceMethod = promisify<string, DeviceMethodParams, any>((d, p, cb: any) =>
        client.invokeDeviceMethod(d, p, cb));

    const methodParams = {
        methodName: req.query.off !== undefined ? "onSwitchOff" : "onSwitchOn",
    };
    try {
        const result = await invokeDeviceMethod(deviceId, methodParams);

        context.res = {
            body: result.payload,
            status: result.status,
        };
    } catch (err) {
        context.log.error(`Failed to invoke method "${methodParams.methodName}" with error: "${err.message}"`, err);
        context.res = {
            body: "Failed to invoke method",
            status: 500,
        };
    }
    // context.log('HTTP trigger function processed a request.');
    // const name = (req.query.name || (req.body && req.body.name));

    // if (name) {
    //     context.res = {
    //         // status: 200, /* Defaults to 200 */
    //         body: "Hello " + (req.query.name || req.body.name)
    //     };
    // }
    // else {
    //     context.res = {
    //         status: 400,
    //         body: "Please pass a name on the query string or in the request body"
    //     };
    // }
};

export default httpTrigger;
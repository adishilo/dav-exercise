const express = require('express');
const config = require('./config');
const consts = require('./consts');
const path = require('path');
const vehicleManager = require('./VehicleManager');

class Server {
    constructor() {
        this.app = express();
        this.app.use(express.json());

        this.app.get('/status/:vehicle_id', async (request, response, next) => {
            let replyBody = await vehicleManager.getVehicleInfo(request.params.vehicle_id);

            if (!replyBody) {
                response.status(consts.httpStatuses.badRequest).send(`No such vehicle with ID ${request.params.vehicle_id}`);
            }
            else {
                response.status(consts.httpStatuses.ok).send(replyBody);
            }

            next();
        });

        this.app.listen(config.serverPort, async () => {
            await vehicleManager.registerVehicles(path.resolve(__dirname, '../vehicles-init.json'));

            console.log(`Now listening on port ${config.serverPort}`);
        });
    }
}

module.exports = new Server();
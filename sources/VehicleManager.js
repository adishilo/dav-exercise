const geo = require('geolib');
const VehicleState = require('./dto/VehicleState');
const redisClient = require('./RedisPromisifier');
const consts = require('./consts');

class VehicleManager {
    async registerVehicles(fileName) {
        this.vehicles = require(fileName);

        let now = Date.now();

        for (let vehicle of this.vehicles) {
            vehicle.startTime = now;
            vehicle.velocityKmh = geo.getSpeed(
                { latitude: vehicle.pickup_lat, longitude: vehicle.pickup_long, time: 0 },
                { latitude: vehicle.dropoff_lat, longitude: vehicle.dropoff_long, time: vehicle.time_to_dropoff * 1000 }
            );
            vehicle.bearing = geo.getBearing(
                { latitude: vehicle.pickup_lat, longitude: vehicle.pickup_long },
                { latitude: vehicle.dropoff_lat, longitude: vehicle.dropoff_long }
            );
            vehicle.state = 'travelling';
            vehicle.currentLatitude = vehicle.pickup_lat;
            vehicle.currentLongtitude = vehicle.pickup_long;

            try {
                await redisClient.zadd(consts.vehiclesSetName, vehicle.vehicle_id, JSON.stringify(vehicle)).catch(reason => { throw reason; });
            } catch (error) {
                console.log(`Could not insert vehicle ${vehicle.vehicle_id} to the DB`);
            }
        }
    }

    async getVehicleInfo(vehicleId) {
        try {
            let vehicle = JSON.parse(await redisClient.zrangebyscore(consts.vehiclesSetName, vehicleId, vehicleId).catch(reason => { throw reason }));
            let reply = this.formatReply(vehicle);

            vehicle.status = reply.status;
            vehicle.dropoff_lat = reply.dropoff_lat;
            vehicle.dropoff_long = reply.dropoff_long;

            // Update Redis with the 'vehicle' structure..

            return reply;
        } catch (error) {
            return undefined;
        }
    }

    formatReply(vehicle) {
        let now = Date.now();
        let passedTimeSec = (now - vehicle.startTime) / (1000);

        console.log(`Time: ${passedTimeSec}`);

        if (passedTimeSec >= vehicle.time_to_dropoff) {
            return new VehicleState(
                'dropoff',
                vehicle.dropoff_lat,
                vehicle.dropoff_long);
        }

        let distanceM = (vehicle.velocityKmh * 1000) * (passedTimeSec / 3600);
        let currCoords = geo.computeDestinationPoint(
            { latitude: vehicle.pickup_lat, longitude: vehicle.pickup_long },
            distanceM,
            vehicle.bearing);

        return new VehicleState(
            'travelling',
            currCoords.latitude,
            currCoords.longitude);
    }
}

module.exports = new VehicleManager();
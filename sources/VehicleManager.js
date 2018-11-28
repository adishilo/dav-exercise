const geo = require('geolib');
const VehicleState = require('./dto/VehicleState');

class VehicleManager {
    constructor(fileName) {
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
        }
    }

    getVehicleInfo(vehicleId) {
        for (let vehicle of this.vehicles) {
            if (vehicle.vehicle_id === vehicleId) {
                return this.formatReply(vehicle);
            }
        }

        return undefined;
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

module.exports = VehicleManager;
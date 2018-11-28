const redis = require('redis');

class RedisPromisifier {
    constructor() {
        this.redisClient = redis.createClient();

        this.redisClient.on('error', error => {
            console.log(`Caught error: ${error}`);
        });
    }

    multi() {
        return this.redisClient.multi();
    }

    zadd(key, score, value) {
        return new Promise((resolve, reject) => {
            this.redisClient.zadd(key, score, value, (error, reply) => this.handleReply(error, reply, resolve, reject));
        });
    }

    zrangebyscore(key, min, max) {
        return new Promise((resolve, reject) => {
            this.redisClient.zrangebyscore(key, min, max, (error, reply) => this.handleReply(error, reply, resolve, reject));
        });
    }

    watch(key) {
        return new Promise((resolve, reject) => {
            this.redisClient.watch(key, (error, reply) => this.handleReply(error, reply, resolve, reject));
        });
    }

    handleReply(error, reply, resolve, reject) {
        if (error) {
            console.log(`Redis API error: ${error}`);

            reject(error);
            return;
        }

        resolve(reply);
    }
}

module.exports = new RedisPromisifier();
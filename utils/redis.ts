import { Redis } from "ioredis";


const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Redis Connected ${process.env.REDIS_URL}`);
        return process.env.REDIS_URL;
    }

    throw new Error('Redis connection Failed');
}

export const redis = new Redis(redisClient());
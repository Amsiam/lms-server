import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { Secret } from 'jsonwebtoken'
import { redis } from "../utils/redis";

export const isAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler("Login to access this resource", 403));
    }

    const decoded: any = jwt.verify(access_token, process.env.ACCESS_TOKEN as Secret);

    if (!decoded) {

        return next(new ErrorHandler("Access token is not valid", 403));
    }

    const user = await redis.get(decoded.id);

    if (!user) {

        return next(new ErrorHandler("User not found", 403));
    }

    req.user = JSON.parse(user);

    next();
})
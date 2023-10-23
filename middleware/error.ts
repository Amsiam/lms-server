import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";


export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Error";

    //wrong mongodb is

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`

        err = new ErrorHandler(message, 400);
    }

    // duplicate key error

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`

        err = new ErrorHandler(message, 400);
    }

    //wrong jwt token

    if (err.name === "JsonWebTokenError") {
        const message = `Json web token is invalid. Login again`

        err = new ErrorHandler(message, 403);
    }

    //Jwt expired
    if (err.name === "TokenExpireError") {
        const message = `Json web token is expired. Login again`

        err = new ErrorHandler(message, 403);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        trace: err.stackTrace
    })
}
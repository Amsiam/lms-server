import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleware } from "./middleware/error";

import userRouter from './routes/user.route'



export const app = express()


//body parser
app.use(express.json({ limit: "50mb" }))



//cookie parser
app.use(cookieParser())


//cors

app.use(cors({
    origin: process.env.ORIGINS
}))




//routes

app.use("/api/v1/user", userRouter);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    return res.json({
        message: "Okay"
    })
})


//unknow route


app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;

    err.statusCode = 404;

    next(err)
})


//error handler
app.use(ErrorMiddleware)
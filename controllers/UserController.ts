import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel, { IUser } from "../models/user";

import jwt, { JwtPayload, Secret } from "jsonwebtoken";

import ejs from 'ejs'
import path from 'path'
import sendMail from "../utils/sendMail";
import { accessOption, refreshOption, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";

interface IRegisterBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    try {

        const { name, email, password, avatar } = req.body as IRegisterBody;


        const isEmailExists = await userModel.findOne({ email });
        if (isEmailExists) {
            return next(new ErrorHandler("Email already exist.", 400));
        }

        const user: IRegisterBody = {
            name, email, password
        }

        const activitionToken = await createActivationToken(user);

        const activationCode = activitionToken.activationCode;

        const data = {
            user: { name: user.name }, activationCode
        }

        try {
            await sendMail({
                email: user.email,
                subject: "Activate Your Account",
                template: "activation-mail.ejs",
                data,
            });

            res.status(201).json({
                success: true,
                message: "Please check your mail for activation.",
                activitionToken: activitionToken.token
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }

    } catch (error: any) {
        console.log(error);
        return next(new ErrorHandler(error.message, 500));
    }
});


interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = async (user: IRegisterBody): Promise<IActivationToken> => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const alg = "HS256";

    const token = jwt.sign(
        { user, activationCode },
        process.env.SECRET_KEY as Secret,
        {
            expiresIn: "5m"
        }
    );


    return { token, activationCode };

}


interface IActivationRequest {
    activitionToken: string;
    activationCode: string;
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activationCode, activitionToken } = req.body as IActivationRequest;

        const newUser: { user: IUser; activationCode: string } = jwt.verify(activitionToken,
            process.env.SECRET_KEY as Secret) as { user: IUser; activationCode: string };

        if (newUser.activationCode !== activationCode) {
            return next(new ErrorHandler("Invalid activation Code", 400));
        }

        const { name, email, password } = newUser.user;

        const existUser = await userModel.findOne({ email });
        if (existUser) {

            return next(new ErrorHandler("Email Already Exists", 400));
        }

        const user = userModel.create({
            name, email, password, isVerified: true
        });

        res.status(200).json({
            success: true
        });
    } catch (error: any) {

        return next(new ErrorHandler(error.message, 400));
    }
});


interface ILoginRequest {
    email: string;
    password: string;
}


export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {

            return next(new ErrorHandler("Email or Password is missing!", 400));
        }
        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {

            return next(new ErrorHandler("Invaild Email or Password !", 400));
        }
        const isPasswordMatched = user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invaild Email or Password !", 400));
        }


        await sendToken(user, 200, res);
    } catch (error: any) {

        return next(new ErrorHandler(error.message, 400));
    }
});

export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });


        const userId = req.user?._id || "";
        redis.del(userId);

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error: any) {

        return next(new ErrorHandler(error.message, 400));
    }
});


export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;

        const decode = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as Secret) as JwtPayload;

        const message = "Invalid Refresh token."

        if (!decode) {
            return next(new ErrorHandler(message, 403));
        }
        const session = await redis.get(decode.id as string);

        if (!session) {

            return next(new ErrorHandler(message, 403));
        }


        const user = JSON.parse(session);

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as Secret, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE + "m"
        });

        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as Secret, {
            expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1") + "d"
        });
        if (process.env.DEBUG == "false") {
            accessOption.secure = true;
        }
        res.cookie("access_token", accessToken, accessOption);
        res.cookie("refresh_token", refreshToken, refreshOption);

        res.status(200).json({
            success: true,
            accessToken
        })

    } catch (error: any) {

        return next(new ErrorHandler(error.message, 400));
    }
});


export const currentUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        user: req.user
    })
})
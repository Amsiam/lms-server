import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import userModel, { IUser } from "../models/user";

import { SignJWT } from 'jose'

import ejs from 'ejs'
import path from 'path'
import sendMail from "../utils/sendMail";

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

    const token = await new SignJWT({ user, activationCode }).setProtectedHeader({ alg }).setExpirationTime('5m').sign(new TextEncoder().encode(process.env.SECRET_KEY || "ok"))


    return { token, activationCode };

}


interface IActivationRequest {
    activationToken: string;
    activationCode: string;
}
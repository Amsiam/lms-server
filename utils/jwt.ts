import { Response } from "express";

import { redis } from './redis'
import { IUser } from "../models/user";


interface ITokenOption {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "5", 10)
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1", 10)


export const accessOption: ITokenOption = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    };

export const refreshOption: ITokenOption = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    };



export const sendToken = async (user: IUser, statusCode: number, res: Response) => {

    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    //upload session to redis

    redis.set(user._id, JSON.stringify(user));

    //only secure in production

    if (process.env.DEBUG == "false") {
        accessOption.secure = true;
    }
    res.cookie("access_token", accessToken, accessOption);
    res.cookie("refresh_token", refreshToken, refreshOption);

    res.status(statusCode).json({
        success: true,
        user,
        accessToken
    })
}
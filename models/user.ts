import mongoose, { Document, Model, Schema } from "mongoose";
import jwt, { Secret } from 'jsonwebtoken'

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export interface IUser extends Document {
    email: string;
    name: string;
    password: string;
    avatar: {
        public_id: string,
        url: string
    }
    role: string;
    isVerified: boolean,
    courses: Array<{ courseId: string }>

    comparePassword: (password: string) => Promise<boolean>;
    signAccessToken: () => string;
    signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please enter name"]

    },
    email: {
        type: String,
        required: [true, "Please enter email"],
        validate: {
            validator: function (value: string) {
                return emailRegexPattern.test(value);
            },
            message: "Please Enter valid Email"
        },
        unique: true

    },
    password: {
        type: String,
        required: [true, "Please enter password"],
        select: false,
        minlength: [6, "Password must be 6 characters"]
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "USER"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [
        {
            courseId: String
        }
    ]

}, { timestamps: true });


//Hash password

userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified('password')) {
        next()
    }

    this.password = await Bun.password.hash(this.password, "bcrypt");
    next()
})
userSchema.methods.comparePassword = async function (enteredPassword: string) {
    return await Bun.password.verify(enteredPassword, this.password, "bcrypt")
}

//sign access token

userSchema.methods.signAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN as Secret);
}

//sign refresh token

userSchema.methods.signRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN as Secret);
}

const userModel: Model<IUser> = mongoose.model("users", userSchema);

export default userModel;



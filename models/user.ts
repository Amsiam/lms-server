import mongoose, { Document, Model, Schema } from "mongoose";


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

const userModel: Model<IUser> = mongoose.model("users", userSchema);

export default userModel;




import express from 'express'
import { registrationUser } from '../controllers/UserController'

const userRouter = express.Router()

userRouter.post('/register', registrationUser);


export default userRouter;
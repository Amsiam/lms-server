
import express from 'express'
import { activateUser, loginUser, logoutUser, registrationUser, updateAccessToken } from '../controllers/UserController'
import { isAuth } from '../middleware/auth';
import { authorizeRole } from '../middleware/authorizeRole';

const userRouter = express.Router()

userRouter.post('/register', registrationUser);
userRouter.post('/activate-user', activateUser);


userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuth, logoutUser);


userRouter.post('/refreshtoken', updateAccessToken);


export default userRouter;
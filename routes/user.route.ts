
import express from 'express'
import { activateUser, currentUser, loginUser, logoutUser, registrationUser, updateAccessToken } from '../controllers/UserController'
import { isAuth } from '../middleware/auth';
import { authorizeRole } from '../middleware/authorizeRole';

const userRouter = express.Router()

userRouter.post('/register', registrationUser);
userRouter.post('/activate-user', activateUser);


userRouter.post('/login', loginUser);

userRouter.post('/refreshtoken', updateAccessToken);



//auth required

userRouter.get('/logout', isAuth, logoutUser);
userRouter.get('/me', isAuth, currentUser);



export default userRouter;
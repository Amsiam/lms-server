
import { app } from "./app";
import connectDB from "./utils/db";





//create server

let port: Number = Number(process.env.PORT) || 3000

app.listen(port, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);

    connectDB();
});
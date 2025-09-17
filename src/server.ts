import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import getWebSocket from './ws/websocket.js';
import UserRouter from './route/user.js'


dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/user' , UserRouter)

app.get('/' , (req , res)=>{
    res.status(200).json({message : "ping server successed"})
})

const server = http.createServer(app);
getWebSocket(server)


server.listen(PORT , ()=>console.log(`server is running on PORT ${PORT}`))
import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import getWebSocket from './ws/websocket.ts';
import UserRouter from './route/user.ts'


dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/user' , UserRouter)


const server = http.createServer(app);
getWebSocket(server)


server.listen(PORT , ()=>console.log(`server is running on PORT ${PORT}`))
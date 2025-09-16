import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";
import url from "url";

dotenv.config();

type userData = {
  role: string;
  email: string;
  iat: number;
  exp: number;
};

interface ExtendWebSocket extends WebSocket {
  // user: userData;
  uid : string
}

interface UserLocation{
  uid : string , 
  latitude : number,
  longitude : number
}

const getWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ noServer: true, clientTracking: true, path: "/ws" });

  let ALL_USER_LOCATION : UserLocation[]=[] // เก็บตำแหน่งปัจจุบันของ user ทุกคนไว้ในนี้

  server.on("upgrade", (req, socket, head) => {
    // const parsedUrl = url.parse(req.url || "", true);
    // const token = parsedUrl.query.token as string;

    // if (!token) {
    //   socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    //   socket.destroy();
    //   return;
    // }

    try {
        // let decoded : userData;
        // if(token === process.env.DRIVER_ADMIN_TOKEN){
        //     decoded = {email : 'driverAdmin@ku.th' , role : 'driver' , exp : 10 , iat : 10}
        // }else if(token=== process.env.USER_ADMIN_TOKEN){
        //     decoded = {email : 'userAdmin@ku.th' , role : 'user' , exp : 10 , iat : 10}
        // }else{
        //     decoded = jwt.verify(token, process.env.JWT_SECRET as string) as userData;
        // }
        const parsedUrl = url.parse(req.url || "", true);
      const uid = parsedUrl.query.uid as string;
      wss.handleUpgrade(req, socket, head, (ws) => {
        const client = ws as ExtendWebSocket;
        // client.user = decoded;
        client.uid = uid
        wss.emit("connection", client, req);
      });
    } catch (err) {
      console.log(err)
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws: ExtendWebSocket) => {
    console.log(`✅ Connected`);
    ws.on("message", (message) => {
      try {
      
        // const data = JSON.parse(message.toString());
        // if (ws.user.role === "driver") {
        //   wss.clients.forEach((clientSocket) => {
        //     const client = clientSocket as ExtendWebSocket;
        //     if (client.user && client.user.role !== "driver" && client.readyState === WebSocket.OPEN) {
        //       client.send(JSON.stringify({type : "success" , data}));
        //     }
        //   });
        // }

        // ส่งตำแหน่งทั้งหมดไปแสดงด้านหน้า 
        let data= JSON.parse(message.toString())
        data = {
        uid : data.uid,
         latitude : data.lat ,
         longitude : data.lng
        }
        console.log("get data from " , data.uid)
        const index = ALL_USER_LOCATION.findIndex(u => u.uid === data.uid);
        if(index >= 0){
          ALL_USER_LOCATION[index] = data; // update
        }else{
          ALL_USER_LOCATION.push(data); // push ใหม่
        }
        wss.clients.forEach(c=>{
          c.send(JSON.stringify({type: "all_locations" , data : ALL_USER_LOCATION}))
        })

      } catch (error ) {
        ws.send(JSON.stringify({type : 'error' , message : (error as Error).message}))
        console.error(`WebSocket message error from:`, (error as Error).message);
        ws.close(); 
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error from ${ws.uid}:`, error.message);
    });

    ws.on("close", () => {
      console.log(`❌ Disconnected:  ${ws.uid}`);
      if(ALL_USER_LOCATION.find(a=>a.uid===ws.uid)){
        ALL_USER_LOCATION = ALL_USER_LOCATION.filter(a=>a.uid !== ws.uid)
        wss.clients.forEach(c => {
      if(c.readyState === WebSocket.OPEN){
        c.send(JSON.stringify({type: "all_locations", data: ALL_USER_LOCATION}));
      }
    });
      }
    });
  });

  return wss;
};

export default getWebSocket;

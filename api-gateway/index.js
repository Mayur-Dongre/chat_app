// npm i express
// npm i http-proxy-middleware
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const routes = {
	"/api/auth/signup": "http://localhost:8081/auth/signup",
	"/api/auth/login": "http://localhost:8081/auth/login",
	"/api/users": "http://localhost:8081/users",

	"/api/msgs": "http://localhost:8080/msgs",
	"/api/files/:fileId": "http://localhost:8080/files/:fileId",
	"/api/files/summarize/:fileId": "http://localhost:8080/files/summarize/:fileId",
	"/api/files/upload": "http://localhost:8080/files/upload",

};

for (const route in routes) {
	const target = routes[route];
	app.use(route, createProxyMiddleware({ target, changeOrigin: true }));
}

const PORT = 8083;
app.listen(PORT, () => {
	console.log(`api gateway started listening on port : ${PORT}`);
});

import express from "express";
import multer from "multer";
import moment from "moment";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
const defaultData = { user: [], products: [] };
const db = new Low(new JSONFile("db.json"), defaultData);
await db.read();

const upload = multer();

let whiteList = ["http://localhost:5500", "http://127.0.0.1:5500"];
let corsOptions = {
    credentials: true,
    origin(origin, callback) {
        if (!origin || whiteList.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("不允許連線"));
        }
    },
};

const app = express();
app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.send("首頁");
});

app.get("/api/users", (req, res) => {
    const users = db.data.user.map((u) => {
        const { id, password, ...others } = u;
        return others;
    });
    const message = `獲取所有使用者的資料`;
    res.status(200).json({ result: "success", message, data: users });
});

app.get("/api/users/search", (req, res) => {
    const { id } = req.query;
    const result = db.data.user.filter((u) => u.account.includes(id));
    const message = `${id} 的資料搜尋成功`;
    res.status(200).json({ result: "success", message, data: result });
});

app.post("/api/users/login", upload.none(), (req, res) => {
    const { account, password } = req.body;
    let message = `登入成功`;
    const user = db.data.user.find(
        (u) => u.account == account && u.password == password
    );
    if (!user) {
        message = `登入失敗`;
        return res.status(404).json({ result: "fail", message });
    }
    let token = jwt.sign(
        {
            account: user.account,
            name: user.name,
            mail: user.mail,
            head: user.head,
        },
        process.env.SECRET_KEY,
        { expiresIn: "30m" }
    );
    res.status(200).json({ result: "success", message, data: token });
});

app.get("/api/users/logout", (req, res) => {
    const message = `登出成功`;
    res.status(200).json({ message });
});

app.get("/api/users/status", (req, res) => {
    const message = `狀態檢查成功`;
    res.status(200).json({ message });
});

// 檢查帳號有沒有被使用
app.get("/api/users/account", async (req, res) => {
    const { account } = req.query;
    let message = "帳號沒有被使用";
    let result = db.data.user.find((u) => u.account == account);
    if (result) {
        message = "帳號已經被使用";
        return res.status(400).json({ result: "fail", message });
    }
    res.status(200).json({ result: "success", message });
});

// 檢查mail有沒有被使用
app.get("/api/users/mail", async (req, res) => {
    const { mail } = req.query;
    let message = "mail沒有被使用";
    let result = db.data.user.find((u) => u.mail == mail);
    if (result) {
        message = "mail已經被使用";
        return res.status(400).json({ result: "fail", message });
    }
    res.status(200).json({ result: "success", message });
});

app.get("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const user = db.data.user.find((u) => u.account == id);
    if (!user) {
        const message = `找不到使用者`;
        res.status(404).json({ result: "fail", message });
        return;
    }
    const message = `找到使用者`;
    res.status(200).json({ result: "success", message, data: user });
});

app.post("/api/users", upload.none(), async (req, res) => {
    const { account, password, name, mail, head } = req.body;
    let message = "新增成功";
    let result = db.data.user.find((u) => u.account == account);
    if (result) {
        message = "帳號已經被使用";
        return res.status(400).json({ result: "fail", message });
    }
    result = db.data.user.find((u) => u.mail == mail);
    if (result) {
        message = "mail已經被使用";
        return res.status(400).json({ result: "fail", message });
    }
    db.data.user.push({
        id: uuidv4(),
        account,
        password,
        name,
        mail,
        head,
    });
    await db.write();
    res.status(201).json({ result: "success", message });
});

app.put("/api/users/:id", upload.none(), async (req, res) => {
    // 檢查有沒有在登入狀態
    // 檢查登入狀態的使用者和修改的對象是否一致
    // 還可以做檢查帳號權限
    const { password, name, mail, head } = req.body;
    const { id } = req.params;
    const user = db.data.user.find((u) => (u.account = id));
    Object.assign(user, { password, name, mail, head });
    const message = `資料更新成功`;
    await db.write();
    res.status(200).json({ result: "success", message });
});

app.delete("/api/users/:id", async (req, res) => {
    // 檢查有沒有在登入狀態
    // 檢查登入狀態的使用者和修改的對象是否一致
    // 還可以做檢查帳號權限
    const { id } = req.params;
    let message = `資料刪除成功`;
    const user = db.data.user.find((u) => u.account == id);
    if (!user) {
        message = `找不到使用者`;
        return res.status(404).json({ result: "fail", message });
    }
    db.data.user = db.data.user.filter((u) => u.account != id);
    await db.write();
    res.status(200).json({ result: "success", message });
});

app.listen(3000, () => {
    console.log("server is running at http://localhost:3000");
});


// TTTTTTTTTTTTTTTTTTTTTTTTTTTTEST JZ_dev

// CCCCCCCCCCCCCCCCCCCCCCCCCC

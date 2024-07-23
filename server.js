const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"], // Added PUT method
        credentials: true,
    })
);

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mbs_db",
});

const verifyUser = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res.json({ valid: false, Message: "we need token please provide it." });
    } else {
        jwt.verify(token, "myToken", (err, decoded) => {
            if (err) {
                return res.json({ valid: false, Message: "Authentication Error." });
            } else {
                req.userId = decoded.userId;
                req.name = decoded.name;
                next();
            }
        });
    }
};

app.post("/login", (req, res) => {
    const sql = "SELECT * FROM user WHERE email = ? AND password = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) return res.json({ Message: "Server Side Error" });
        if (data.length > 0) {
            const name = data[0].f_name;
            const userId = data[0].u_id;
            const token = jwt.sign({ name, userId }, "myToken", { expiresIn: "1d" });
            res.cookie("token", token, { httpOnly: true, sameSite: 'Strict' });
            return res.json({ Status: "Success", token });
        } else {
            return res.json({ Message: "No Record exists in database" });
        }
    });
});

app.get("/checkAdmin", verifyUser, (req, res) => {
    const sql = `
    SELECT u.u_id, 
    CASE 
      WHEN a.u_id IS NOT NULL THEN 'Admin' 
      ELSE 'Not Admin' 
    END AS isAdmin 
    FROM user u 
    LEFT JOIN admin a ON u.u_id = a.u_id 
    WHERE u.u_id = ?
  `;
    db.query(sql, [req.userId], (err, data) => {
        if (err) return res.json({ Message: "Server Side Error" });
        if (data.length > 0) {
            return res.json({ Status: "Success", isAdmin: data[0].isAdmin });
        } else {
            return res.json({ Status: "Failure", Message: "User not found" });
        }
    });
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    return res.json({ Status: "Success" });
});

app.get("/checkToken", verifyUser, (req, res) => {
    return res.json({ valid: true, userId: req.userId, name: req.name });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/product_images");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.post("/addProduct", upload.single('image'), (req, res) => {
    const { name, price, qty, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = "INSERT INTO product (pd_type, pd_price, qty, pd_description, pd_image) VALUES (?, ?, ?, ?, ?)";
    const values = [name, price, qty, description, image];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting product data into the database:", err);
            return res.status(500).json({ Message: "Error inserting product data into the database" });
        }
        return res.json({ Status: "Success" });
    });
});

app.get("/getProducts", (req, res) => {
    const sql = "SELECT * FROM product";
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching product data from the database:", err);
            return res.status(500).json({ Message: "Error fetching product data from the database" });
        }
        return res.json({ Status: "Success", products: data });
    });
});
app.get("/getProduct/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM product WHERE pd_id = ?";
    db.query(sql, [id], (err, data) => {
        if (err) {
            console.error("Error fetching product data from the database:", err);
            return res.status(500).json({ Message: "Error fetching product data from the database" });
        }
        if (data.length > 0) {
            return res.json({ Status: "Success", product: data[0] });
        } else {
            return res.status(404).json({ Message: "Product not found" });
        }
    });
});

app.post("/createOrder", verifyUser, upload.single('o_slip'), (req, res) => {
    const { u_id, pd_id, qty } = req.body;
    const o_slip = req.file ? req.file.filename : null;

    const query = 'INSERT INTO product_order (u_id, pd_id, o_slip, qty) VALUES (?, ?, ?, ?)';
    const values = [u_id, pd_id, o_slip, qty];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Error creating order:", err);
            return res.status(500).json({ Message: "Error creating order" });
        }
        res.status(200).json({ Status: "Success", Message: "Order created successfully" });
    });
});

app.get("/getOrders", (req, res) => {
    const sql = `
    SELECT 
        u.f_name AS userName,
        u.email AS userEmail,
        p.pd_type AS productName,
        po.qty,
        po.o_id
    FROM product_order po
    JOIN user u ON po.u_id = u.u_id
    JOIN product p ON po.pd_id = p.pd_id
    `;
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching order data from the database:", err);
            return res.status(500).json({ Message: "Error fetching order data from the database" });
        }
        return res.json({ Status: "Success", orders: data });
    });
});

app.delete("/deleteOrder/:id",  (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM product_order WHERE o_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting order:", err);
            return res.status(500).json({ Message: "Error deleting order" });
        }
        return res.json({ Status: "Success", Message: "Order deleted successfully" });
    });
});
app.put(verifyUser, (req, res) => {
    const { id } = req.params;
    const { name, price, qty, description } = req.body;

    const fieldsToUpdate = [];
    if (name) fieldsToUpdate.push(`pd_type = '${name}'`);
    if (price) fieldsToUpdate.push(`pd_price = '${price}'`);
    if (qty) fieldsToUpdate.push(`qty = '${qty}'`);
    if (description) fieldsToUpdate.push(`pd_description = '${description}'`);

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ Message: "No fields to update" });
    }

    const sql = `UPDATE product SET ${fieldsToUpdate.join(', ')} WHERE pd_id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error updating product data:", err);
            return res.status(500).json({ Message: "Error updating product data" });
        }
        return res.json({ Status: "Success", Message: "Product updated successfully" });
    });
});


// Endpoint to get products by type
app.get('/products/:type', (req, res) => {
    const { type } = req.params;
    const query = 'SELECT * FROM product WHERE pd_type = ?';
    db.query(query, [type], (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(results);
    });
  });
  
  app.put('/updateProduct/:id', (req, res) => {
    const { id } = req.params;
    const { pd_price, qty, pd_description } = req.body;
    const query = 'UPDATE product SET pd_price = ?, qty = ?, pd_description = ? WHERE pd_id = ?';
    db.query(query, [pd_price, qty, pd_description, id], (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ Status: "Success" });
    });
  });



app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

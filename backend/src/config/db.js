import mongoose from "mongoose";

class ConnectDB {
    constructor() {
        this.connected = false;
        this.connect();
    }

    async connect() {
        try {
            const url = process.env.MONGODB_URL;

            if (!url) {
                throw new Error("Missing MONGODB_URL environment variable");
            }
            await mongoose.connect(url, {
                maxPoolSize: 10,
            });
            console.log("CONNECTED TO DATABASE",  mongoose.connection.name);
        } catch (error) {
            console.log("❌ Database connection error:", error);
            this.connected = false;
        }
    }

    static getInstance() {
        if (!ConnectDB.instance) {
            ConnectDB.instance = new ConnectDB();
        }
        return ConnectDB.instance;
    }
}

export default ConnectDB;

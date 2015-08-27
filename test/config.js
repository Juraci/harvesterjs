var harvesterPort = process.env.HARVESTER_PORT || 8000;

module.exports = {
    baseUrl: 'http://localhost:' + harvesterPort,
    harvester: {
        port: harvesterPort,
        options: {
            adapter: 'mongodb',
            connectionString: process.env.MONGODB_URL || "mongodb://192.168.59.103:27017/testDB",
            db: process.env.MONGODB || 'testDB',
            inflect: true,
            oplogConnectionString: (process.env.OPLOG_MONGODB_URL || "mongodb://192.168.59.103:27017/local")
        }
    }
};

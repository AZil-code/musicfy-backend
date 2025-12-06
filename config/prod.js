export default {
    dbURL:
        process.env.MONGO_URL ||
        'mongodb+srv://anistavi:anistavi123456@cluster0.radwujg.mongodb.net/',
    dbName: process.env.DB_NAME || 'musicfy',
}

// export default {
//     dbURL: process.env.MONGO_URL || 'mongodb+srv://{USERNAME}:{PASSWORD}@cluster0.6qm6pd1.mongodb.net/',
//     dbName: process.env.DB_NAME || 'car_db'
// }

// export default {
//     dbURL: process.env.MONGO_URL,
//     dbName: process.env.DB_NAME '
// }

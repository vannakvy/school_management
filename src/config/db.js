import mongoose from 'mongoose'
import dotenv from 'dotenv'
import {error, success} from 'consola'


dotenv.config()
// const DB_URI = IN_PROD? "mongodb://localhost:27017/newDatabase" : DB

const connectDB =   async()=>{
    try{
        const conn =  await mongoose.connect(process.env.DB_RUL,{useUnifiedTopology:true,useNewUrlParser: true})
        success({
            badge: true,
            message: `Successfully connected with the database ${conn.connection}`,
          });
    }catch(err){
        error({
            badge: true,
            message: err.message,
          });
    }
}

export default connectDB;

import mongoose from 'mongoose'

const tokenSchema = mongoose.Schema({
    refreshToken:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})

const RefreshToken = mongoose.model("RefreshToken",tokenSchema)

export default RefreshToken;
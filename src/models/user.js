import {
    model,
    Schema
} from 'mongoose';
import Paginate from 'mongoose-paginate-v2';


const pageSchema = Schema({
   page:String})

const UserSchema = new Schema({
    // username: {
    //     type: String,
    //     required: true
    // },
    tel: String,
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true,
        default:"profile.png"
    },
    roles:{
        type:String,
        default:"BASIC"
    },
    pages:[
        pageSchema
    ]
}, {
    timestamps: true
});

UserSchema.plugin(Paginate)
const User = model('users', UserSchema);

export default User;
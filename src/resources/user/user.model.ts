import { Schema, model } from 'mongoose';
import User from '@/resources/user/user.interface';

const UserSchema = new Schema(
  {
    username: {
      type: String,
      require: true
    },
    password: {
      type: String,
      require: true
    },
    email: {
      type: String,
      require: true
    },
    forgotPw: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default model<User>('User', UserSchema);

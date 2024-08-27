import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import User from '@/resources/user/user.interface';

const UserSchema = new Schema(
  {
    username: {
      type: String,
      require: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      require: true
    },
    email: {
      type: String,
      require: true,
      trim: true
    },
    forgotPw: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

UserSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.methods.isValidPassword = async function (password: string): Promise<Error | boolean> {
  return await bcrypt.compare(password, this.password);
};

export default model<User>('User', UserSchema);

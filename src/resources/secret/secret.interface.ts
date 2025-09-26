import { Document } from 'mongoose';

export default interface Secret extends Document {
  label: string;
  secret: string;
  notes: string;
}

import { Document, Types } from 'mongoose';

type DecryptedField<T extends 'data' | 'label' | 'notes'> = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
} & { [K in T]: string | null };

export interface Secret extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  data: string;
  label: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  decryptAll(): {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    data: string | null;
    label: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  decryptField<T extends 'data' | 'label' | 'notes'>(fieldName: T): DecryptedField<T>;
}

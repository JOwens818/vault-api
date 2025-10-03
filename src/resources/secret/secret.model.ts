import mongoose, { Schema, Model, Types } from 'mongoose';
import { Secret } from './secret.interface';
import { encryptPlainText, decryptToPlainText } from '@/utils/crypto';

// Utility type for decryptField return
type DecryptedField<T extends 'data' | 'label' | 'notes'> = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
} & { [K in T]: string | null };

export type DecryptedLabel = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label: string;
};

interface SecretModel extends Model<Secret> {
  findWithDecryptedLabel(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId; label: string } | null>;

  findAllLabelsForUser(userId: mongoose.Types.ObjectId): Promise<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId; label: string }[]>;
}

const secretSchema = new Schema<Secret>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    data: { type: String, required: true },
    label: { type: String, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

// Encrypt before saving
secretSchema.pre('save', function (next) {
  if (this.isModified('data')) {
    this.data = encryptPlainText(this.data);
  }
  if (this.isModified('label')) {
    this.label = encryptPlainText(this.label);
  }
  if (this.isModified('notes')) {
    this.notes = encryptPlainText(this.notes || '');
  }
  next();
});

// Encrypt several secrets at once
secretSchema.pre('insertMany', function (next, docs: Secret[]) {
  for (const doc of docs) {
    if (doc.data) doc.data = encryptPlainText(doc.data);
    if (doc.label) doc.label = encryptPlainText(doc.label);
    if (doc.notes) doc.notes = encryptPlainText(doc.notes);
  }
  next();
});

// Instance method: decrypt all fields
secretSchema.methods.decryptAll = function () {
  return {
    _id: this._id,
    userId: this.userId,
    data: this.data ? decryptToPlainText(this.data) : null,
    label: this.label ? decryptToPlainText(this.label) : null,
    notes: this.notes ? decryptToPlainText(this.notes) : null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Instance method: decrypt one field (generic + strongly typed)
secretSchema.methods.decryptField = function <T extends 'data' | 'label' | 'notes'>(fieldName: T): DecryptedField<T> {
  const value = this[fieldName] ? decryptToPlainText(this[fieldName]) : null;
  return {
    _id: this._id,
    userId: this.userId,
    [fieldName]: value
  } as DecryptedField<T>;
};

// Static method: fetch & decrypt label only
secretSchema.statics.findWithDecryptedLabel = async function (id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
  const doc = await this.findOne({ _id: id, userId }).select('_id label userId');
  if (!doc) return null;
  return {
    _id: doc._id,
    userId: doc.userId,
    label: decryptToPlainText(doc.label)
  };
};

// Static method: fetch all labels for a user
secretSchema.statics.findAllLabelsForUser = async function (userId: mongoose.Types.ObjectId) {
  const docs = await this.find({ userId }).select('_id label userId');
  const decrypted: DecryptedLabel[] = docs.map((doc: Secret) => ({
    _id: doc._id,
    userId: doc.userId,
    label: decryptToPlainText(doc.label)
  }));

  return decrypted.sort((a: DecryptedLabel, b: DecryptedLabel) => a.label.localeCompare(b.label));
};

export const SecretModel = mongoose.model<Secret, SecretModel>('Secret', secretSchema);

import { DecryptedLabel, SecretModel } from '@/resources/secret/secret.model';
import { Secret } from '@/resources/secret/secret.interface';
import HttpException from '@/utils/exceptions/http.exception';
import { Types } from 'mongoose';

interface CreateSecretDTO {
  userId: Types.ObjectId;
  data: string;
  label: string;
  notes?: string;
}

interface UpdateSecretDTO {
  data?: string;
  label?: string;
  notes?: string;
}

export interface ImportRow {
  data: string;
  label: string;
  notes?: string;
}

class SecretService {
  private secret = SecretModel;

  public createSecret = async (dto: CreateSecretDTO): Promise<void> => {
    try {
      const { userId, data, label, notes } = dto;
      const newSecret = new this.secret({ userId, data, label, notes });
      await newSecret.save();
    } catch (err) {
      return this.handleError(err);
    }
  };

  public getSecret = async (userId: Types.ObjectId, secretId: Types.ObjectId): Promise<ReturnType<Secret['decryptAll']>> => {
    try {
      const fetchedSecret = await this.secret.findOne({ _id: secretId, userId });
      if (!fetchedSecret) {
        throw new HttpException(404, 'Secret not found');
      }
      return fetchedSecret.decryptAll();
    } catch (err) {
      return this.handleError(err);
    }
  };

  public getAllLabelsForUser = async (userId: Types.ObjectId): Promise<DecryptedLabel[]> => {
    try {
      return await this.secret.findAllLabelsForUser(userId);
    } catch (err) {
      return this.handleError(err);
    }
  };

  public updateSecret = async (userId: Types.ObjectId, secretId: Types.ObjectId, updates: UpdateSecretDTO): Promise<void> => {
    try {
      const fetchedSecret = await this.secret.findOne({ _id: secretId, userId });
      if (!fetchedSecret) {
        throw new HttpException(404, 'Secret does not exist');
      }
      if (updates.data !== undefined) fetchedSecret.data = updates.data;
      if (updates.label !== undefined) fetchedSecret.label = updates.label;
      if (updates.notes !== undefined) fetchedSecret.notes = updates.notes;
      await fetchedSecret.save();
    } catch (err) {
      return this.handleError(err);
    }
  };

  public deleteSecret = async (userId: Types.ObjectId, secretId: Types.ObjectId): Promise<void> => {
    try {
      const result = await this.secret.deleteOne({ _id: secretId, userId });
      if (result.deletedCount !== 1) {
        throw new HttpException(404, 'Secret not found');
      }
    } catch (err) {
      return this.handleError(err);
    }
  };

  public importSecrets = async (userId: Types.ObjectId, rows: ImportRow[]): Promise<number> => {
    try {
      const docs = rows
        .filter((row) => row.label && row.data)
        .map((row) => ({
          userId,
          data: String(row.data),
          label: String(row.label),
          notes: row.notes ? String(row.notes) : undefined
        }));

      if (docs.length === 0) {
        throw new HttpException(400, 'No secrets found in import file');
      }

      const imported = await this.secret.insertMany(docs, { ordered: false });
      return imported.length;
    } catch (err) {
      return this.handleError(err);
    }
  };

  public exportSecrets = async (userId: Types.ObjectId): Promise<ImportRow[]> => {
    try {
      const fetchedSecrets = await this.secret.find({ userId });
      const decryptedList = fetchedSecrets.map((s) => {
        const decrypted = s.decryptAll();
        return {
          data: decrypted.data ?? '',
          label: decrypted.label ?? '',
          notes: decrypted.notes ?? ''
        };
      });

      // Sort alphabetically
      return decryptedList.sort((a, b) => {
        return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      });
    } catch (err) {
      return this.handleError(err);
    }
  };

  private handleError = (err: unknown): never => {
    const error = err as unknown;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpException(400, message);
  };
}

export default SecretService;

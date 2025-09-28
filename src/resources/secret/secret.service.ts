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

class SecretService {
  private secret = SecretModel;

  public createSecret = async (dto: CreateSecretDTO): Promise<void> => {
    try {
      const { userId, data, label, notes } = dto;
      const newSecret = new this.secret({ userId, data, label, notes });
      await newSecret.save();
    } catch (err) {
      const error = err as unknown;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(400, message);
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

  private handleError = (err: unknown): never => {
    const error = err as unknown;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpException(400, message);
  };
}

export default SecretService;

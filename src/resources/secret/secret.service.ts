import { SecretModel } from '@/resources/secret/secret.model';
import { Secret } from '@/resources/secret/secret.interface';
import HttpException from '@/utils/exceptions/http.exception';
import { Types } from 'mongoose';

interface CreateSecretDTO {
  userId: Types.ObjectId;
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
      const error = err as unknown;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(400, message);
    }
  };

  public getSecret = async (userId: Types.ObjectId, secretId: Types.ObjectId): Promise<ReturnType<Secret['decryptAll']>> => {
    try {
      const fetchedSecret = await this.secret.findOne({ _id: secretId, userId });
      if (!fetchedSecret) {
        throw new HttpException(404, 'Secret does not exist');
      }
      return fetchedSecret.decryptAll();
    } catch (err) {
      const error = err as unknown;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(400, message);
    }
  };
}

export default SecretService;

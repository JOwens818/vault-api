import { cleanEnv, str, port } from 'envalid';

const validateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['development', 'production']
    }),
    MONGODB_USERNAME: str(),
    MONGODB_PASSWORD: str(),
    MONGODB_DATABASE: str(),
    MONGODB_HOST: str(),
    MONGODB_PORT: str(),
    PORT: port({ default: 3000 }),
    JWT_PUBLIC: str(),
    JWT_PRIVATE: str()
  });
};

export default validateEnv;

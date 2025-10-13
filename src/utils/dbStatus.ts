let mongoStatus = 'disconnected';

export const setMongoStatus = (status: string): void => {
  mongoStatus = status;
};

export const getMongoStatus = (): string => {
  return mongoStatus;
};

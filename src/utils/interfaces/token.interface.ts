// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
interface Token extends Object {
  un: string;
  expiresIn: number;
}

export default Token;

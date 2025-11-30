export type EnvVariable = {
  key: string;
  value: string;
  group?: "client" | "server" | "shared";
  description?: string;
  required?: boolean;
};

export type Variables = Record<string, EnvVariable>;

export type Issue = {
  message: string;
  path: readonly (string | number)[];
};

export enum Status {
  ALL = "all",
  VALID = "valid",
  INVALID = "invalid",
}

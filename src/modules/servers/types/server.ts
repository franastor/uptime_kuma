export type ServerConnectionStatus =
  | "never"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "auth-error";

export type KumaServer = {
  id: string;
  name: string;
  url: string;
  username: string;
  hasTwoFactor: boolean;

  connectionStatus: ServerConnectionStatus;

  lastConnectionAt: string | null;
  lastSyncAt: string | null;
  lastConnectionError: string | null;

  createdAt: string;
  updatedAt: string;
};

export type KumaServerCredentials = {
  password: string;
};

export type KumaServerSession = {
  token: string;
  issuedAt: string;
};

export type CreateKumaServerInput = {
  name: string;
  url: string;
  username: string;
  password: string;
  hasTwoFactor: boolean;
};

export type UpdateKumaServerInput = {
  serverId: string;
  name: string;
  url: string;
  username: string;
  password: string;
  hasTwoFactor: boolean;
};

export type UpdateServerConnectionInput = {
  serverId: string;
  status: ServerConnectionStatus;
  error?: string | null;
};

export type UpdateServerSyncInput = {
  serverId: string;
  syncedAt?: string;
};
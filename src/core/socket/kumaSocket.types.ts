export type KumaLoginCredentials = {
    username: string;
    password: string;
    token?: string;
  };
  
  export type KumaLoginResponse = {
    ok: boolean;
    msg?: string;
    msgi18n?: boolean;
    token?: string;
    tokenRequired?: boolean;
  };
  
  export type KumaSocketConnectionOptions = {
    url: string;
    timeout?: number;
  };
  
  export type KumaSocketDisconnectReason =
    | "io server disconnect"
    | "io client disconnect"
    | "ping timeout"
    | "transport close"
    | "transport error"
    | string;
  
  export class KumaConnectionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "KumaConnectionError";
    }
  }
  
  export class KumaAuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "KumaAuthenticationError";
    }
  }
  
  export class KumaTwoFactorRequiredError extends Error {
    constructor() {
      super("Se necesita el código de autenticación en dos pasos.");
      this.name = "KumaTwoFactorRequiredError";
    }
  }
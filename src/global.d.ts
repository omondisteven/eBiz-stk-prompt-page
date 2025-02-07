// global.d.ts
interface Navigator {
    contacts?: {
      select: (properties: string[], options?: { multiple: boolean }) => Promise<unknown[]>;
    };
  }
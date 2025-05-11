// /src/types/api.d.ts
import { NextApiRequest, NextApiResponse } from 'next';

declare module '@/types/api' {
  export type ApiResponse = Promise<void | NextApiResponse>;
  export type ApiHandler = (
    req: NextApiRequest,
    res: NextApiResponse
  ) => ApiResponse;
}
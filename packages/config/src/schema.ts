import { z } from 'zod';

export const chCoord = z.object({
  e: z.number().finite(),
  n: z.number().finite()
});

export const source = z
  .object({
    kind: z.enum(['snapshot', 'hls', 'iframe', 'page']),
    url: z.string().url().optional(),
    page: z.string().url().optional(),
    selector: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'page') {
      if (!value.page) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'source requires page for kind=page'
        });
      }
      return;
    }

    if (!value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'source requires url for kind!=page'
      });
    }
  });

export const webcam = z.object({
  id: z.preprocess(value => {
    if (typeof value === 'number') {
      return String(value);
    }
    return value;
  }, z.string().min(1)),
  name: z.string().min(1),
  elevation_m_asl: z.number().int().nonnegative(),
  coord_ch2056: chCoord,
  source,
  worker_bypass: z.boolean().optional(),
  attribution: z.string().optional()
});

export const settings = z.object({
  user_coord_ch2056: chCoord,
  worker_base_url: z.string().url(),
  refresh_minutes: z.number().finite().nonnegative()
});

export const root = z.object({
  settings,
  webcams: z.array(webcam).min(1)
});

export type RootConfig = z.infer<typeof root>;

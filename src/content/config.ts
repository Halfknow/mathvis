import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleZh: z.string().optional(),
    description: z.string(),
    descriptionZh: z.string().optional(),
    course: z.enum(['linear-algebra', 'calculus', 'probability']),
    module: z.string(),
    moduleZh: z.string().optional(),
    moduleOrder: z.number(),
    lessonOrder: z.number(),
    duration: z.number(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    prerequisites: z.array(z.object({
      title: z.string(),
      slug: z.string(),
    })).optional(),
    manimVideos: z.array(z.object({
      id: z.string(),
      caption: z.string(),
      duration: z.string(),
    })).optional(),
    interactiveWidgets: z.array(z.object({
      id: z.string(),
      type: z.enum(['vector-canvas', 'matrix-3d', 'derivative-slope',
                    'riemann-sum', 'coin-flip', 'normal-dist', 'sampling',
                    'limit-explorer', 'chain-rule', 'optimization', 'accumulation',
                    'ftc-explorer', 'u-substitution', 'area-between-curves',
                    'volume-revolution', 'taylor-explorer', 'slope-field',
                    'surface-gradient', 'volume-slicing', 'sequence-convergence',
                    'series-explorer', 'power-series',
                    'volume-slicer-3d', 'shell-method-3d', 'surface-explorer-3d',
                    'sequence-explorer', 'substitution-explorer', 'parts-explorer',
                    'partial-fractions-vis', 'related-rates-vis', 'arc-length-explorer',
                    'convergence-test-explorer']),
      title: z.string(),
    })).optional(),
    mobileFallback: z.enum(['poster', 'video', 'static-svg']).default('video'),
    publishedAt: z.date().optional(),
  }),
});

export const collections = { lessons };

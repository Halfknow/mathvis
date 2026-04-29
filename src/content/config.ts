import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    course: z.enum(['linear-algebra', 'calculus', 'probability']),
    module: z.string(),
    moduleOrder: z.number(),
    lessonOrder: z.number(),
    duration: z.number(),                         // minutes
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    prerequisites: z.array(z.object({
      title: z.string(),
      slug: z.string(),
    })).optional(),
    publishedAt: z.date().optional(),
  }),
});

export const collections = { lessons };

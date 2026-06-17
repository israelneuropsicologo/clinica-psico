import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Auth Router ──────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie("session");
    return { success: true };
  }),

  upsertUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      await upsertUser({
        openId: ctx.user.openId,
        name: input.name,
        email: input.email,
      });

      return { success: true };
    }),
});

// ─── System Router ──────────────────────────────────────
const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date(),
  })),

  notifyOwner: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Notification] ${input.title}: ${input.content}`);
      return { success: true };
    }),
});

// ─── App Router ──────────────────────────────────────
export const appRouter = router({
  auth: authRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;

import { protectedProcedure } from "./../trpc";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tokenRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input,
          type: "ELECTION_INVITATION",
          OR: [
            {
              invitedVoter: {
                email: ctx.session.user.email,
              },
            },
            {
              invitedCommissioner: {
                email: ctx.session.user.email,
              },
            },
          ],
        },
        include: {
          invitedVoter: true,
          invitedCommissioner: true,
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      if (!token.invitedVoter && !token.invitedCommissioner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      if (token.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Token expired",
        });
      }

      const election = await ctx.prisma.election.findFirstOrThrow({
        where: {
          OR: [
            {
              invitedVoter: {
                some: {
                  id: token.invitedVoter?.id,
                },
              },
            },
            {
              invitedCommissioner: {
                some: {
                  id: token.invitedCommissioner?.id,
                },
              },
            },
          ],
        },
      });

      return { token, election };
    }),
  verify: publicProcedure
    .input(
      z.object({
        type: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]).nullish(),
        token: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.type)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Type is required",
        });

      if (!input.token)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token is required",
        });

      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input.token,
          type: input.type,
        },
      });

      if (!token)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });

      if (token.expiresAt < new Date())
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Token expired",
        });

      switch (input.type) {
        case "EMAIL_VERIFICATION":
          if (!token.userId) return;

          await ctx.prisma.user.update({
            where: {
              id: token.userId,
            },
            data: {
              emailVerified: new Date(),
            },
          });

          await ctx.prisma.verificationToken.deleteMany({
            where: {
              userId: token.userId,
              type: input.type,
            },
          });
          return "EMAIL_VERIFICATION";

        case "PASSWORD_RESET":
          return "PASSWORD_RESET";
      }
    }),
});

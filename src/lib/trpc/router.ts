import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { z } from 'zod';

export const t = initTRPC.context<Context>().create();

const ee = new EventEmitter();
const exchangeObject = z.object({ user: z.string(), path: z.string(), type: z.enum(['text-change','selection-change','cursor-change']), data: z.any() });
type ExchangeObject = z.infer<typeof exchangeObject>;

export const router = t.router({
  allMessages: t.procedure
    .input(z.object({ path: z.string(), user: z.string() }))
    .subscription(({ input }) => {
      return observable<ExchangeObject>((emit) => {
        const onAdd = (message: ExchangeObject) => {
          if (message.user !== input.user) {
            emit.next(message);
          }
        };

        ee.on(input.path, onAdd);

        return () => {
          ee.off(input.path, onAdd);
        };
      });
    }),
  addMessage: t.procedure
    .input(exchangeObject)
    .mutation(async ({ input: message }) => {
      ee.emit(message.path, message);

      return { success: true };
    })
});

export type Router = typeof router;
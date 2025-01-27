import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { EventEmitter, on } from 'events';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import Delta from 'quill-delta';
import { pastel_colors } from '$lib/colors';



class DataStore {

  private readonly onChange = new EventEmitter();


  public subscribe(callback: ({ day, type }: { day: number, type: 'add' | 'remove' }) => void) {
    this.onChange.on('change', callback);
  }
  public unsubscribe(callback: ({ day, type }: { day: number, type: 'add' | 'remove' }) => void) {
    this.onChange.off('change', callback);
  }

  updateText(day: number, delta: Delta) {
    const text = this.getText(day);

    const newDelta = text.compose(delta);
    if (newDelta.ops.length === 0) {
      this.data.delete(day);
      const filePath = path.join(DataStore.location, day.toString());
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.onChange.emit('change', { type: 'remove', day });
    }
    else {

      this.data.set(day, newDelta);
      if (!fs.existsSync(DataStore.location)) {
        fs.mkdirSync(DataStore.location);
      }
      if (!fs.existsSync(path.join(DataStore.location, day.toString()))) {
        this.onChange.emit('change', { type: 'add', day });
      }
      fs.writeFileSync(path.join(DataStore.location, day.toString()), JSON.stringify(newDelta), 'utf-8');
    }
  }

  public getAllDaysWithData(): number[] {
    if (!fs.existsSync(DataStore.location)) {
      fs.mkdirSync(DataStore.location);
    }
    return fs.readdirSync(DataStore.location).map((file) => parseInt(file));
  }


  private data: Map<number, Delta> = new Map<number, Delta>();

  public static readonly instance: DataStore = new DataStore();
  private static readonly location = "data/"

  private constructor() {
  }


  public getText(day: number): Delta {
    if (this.data.has(day)) {
      return this.data.get(day) as Delta;
    }
    const filePath = path.join(DataStore.location, day.toString());
    if (fs.existsSync(filePath)) {
      this.data.set(day, new Delta(JSON.parse(fs.readFileSync(filePath, 'utf-8'))));
      return this.data.get(day) as Delta;
    }
    const delta = new Delta();
    this.data.set(day, delta);
    return delta;
  }

}

class DayStore {
  private currentDay: number | undefined;
  private static readonly saveLocation = "currentDay";
  public static readonly instance: DayStore = new DayStore();


  private constructor() {


  }

  public set day(day: number) {
    this.currentDay = day;
    fs.writeFileSync(DayStore.saveLocation, day.toString());
  }
  public get day(): number {
    if (this.currentDay === undefined) {
      if (fs.existsSync(DayStore.saveLocation)) {
        this.currentDay = parseInt(fs.readFileSync(DayStore.saveLocation, 'utf-8'));
      }
      else {
        console.warn('No day set defaurt to 0')
        this.currentDay = 0;
      }
    }
    return this.currentDay;
  }
}


type DayData = { hasData: boolean, day: number };
export type YearData = Record<number, Omit<DayData, 'day'>>;


export type UserData = { id: string, name: string, color: string };

const users: Record<string, UserData> = {};

let lastColorIndex = 0;



export const t = initTRPC.context<Context>().create();

const dataStore = DataStore.instance;

const broadcast = new EventEmitter();
const exchangeObject = z.object({ user: z.string(), day: z.number(), type: z.enum(['text-change', 'selection-change', 'user-add', 'user-remove', 'init']), data: z.any() });
type ExchangeObject = z.infer<typeof exchangeObject>;



export const router = t.router({
  allMessages: t.procedure
    .input(z.object({ day: z.number(), user: z.string(), name: z.string() }))
    .subscription(({ input }) => {
      return observable<ExchangeObject>((tooCurrentUser) => {
        const onAdd = (message: ExchangeObject) => {
          if (message.user !== input.user) {
            tooCurrentUser.next(message);
          }
        };
        const user = { id: input.user, name: input.name, color: pastel_colors[lastColorIndex] };
        lastColorIndex = (lastColorIndex + 1) % pastel_colors.length;
        users[input.user] = user;

        broadcast.emit(input.day.toString(), { user: input.user, day: input.day, type: 'user-add', data: user });

        tooCurrentUser.next({ user: 'api', day: input.day, type: 'init', data: dataStore.getText(input.day) });
        for (const user of Object.values(users)) {
          tooCurrentUser.next({ user: 'api', day: input.day, type: 'user-add', data: user });
        }
        broadcast.on(input.day.toString(), onAdd);

        return () => {
          tooCurrentUser.next({ user: input.user, day: input.day, type: 'user-remove', data: null });
          broadcast.off(input.day.toString(), onAdd);
        };
      });
    }),
  addMessage: t.procedure
    .input(exchangeObject)
    .mutation(async ({ input: message }) => {
      if (message.type === 'text-change') {
        dataStore.updateText(message.day, message.data as Delta);
      }
      broadcast.emit(message.day.toString(), message);

      return { success: true };
    }),
  changeLisener: t.procedure.subscription(() => {
    return observable<number[] | DayData>((tooCurrentUser) => {

      const onChange = ({ day, type }: { day: number, type: 'add' | 'remove' }) => {
        tooCurrentUser.next({ hasData: type === 'add', day });
      };
      dataStore.subscribe(onChange);

      dataStore.getAllDaysWithData().forEach((day) => {
        tooCurrentUser.next({ hasData: true, day });
      });

      return () => {
        dataStore.unsubscribe(onChange);
      };

    });
  }),
  dayListener: t.procedure.subscription(() => {
    return observable<number>((tooCurrentUser) => {
      const onAdd = (day: number) => {
        tooCurrentUser.next(day);
      };
      broadcast.on('day', onAdd);
      tooCurrentUser.next(DayStore.instance.day);
      return () => {
        broadcast.off('day', onAdd);

      };
    });
  }),
  dayChange: t.procedure.input(z.number()).mutation(({ input }) => {
    DayStore.instance.day = input;
    broadcast.emit('day', input);
    return { success: true };
  }),
});


export type Router = typeof router;
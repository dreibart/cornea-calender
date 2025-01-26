// place files you want to import through the `$lib` alias in this folder.

function mod(n:number, m:number) {
    return ((n % m) + m) % m;
  }

export class CorneaDate {
    private _daysSinceEpoch: number;

    public static readonly dayOfWeekNames = ["Mirdey", "Litdey", "Skardey", "Gordey", "Isdey", "Zondey"];
    public static readonly weekNames = ["Mirae", "Letor", "Askor", "Goran", "Karis"];
    public static readonly monthNames = ["Temir", "Rukor", "Aslan", "Ombar", "Sinis"];
    public static readonly moonYearNames = ["Goraskar", "Kariskar", "Miraskar", "Leroskar"];


    public static fromEpoch(dayInEpcoh: number) {
        return new CorneaDate(dayInEpcoh -1);
    }

    public static from({sunYear, moonYear, month, day} : {sunYear?: number, moonYear?: number, month?: number, day?: number}) {
        return new CorneaDate((sunYear??0)*600 + (moonYear??0)*150 + (month??0)*30 + (day??0));
    }

    constructor(daysSinceEpoch: number) {
        this._daysSinceEpoch = daysSinceEpoch;
    }

    public get daysSinceEpoch() {
        return this._daysSinceEpoch+1;
    }

    public get day() {
        return mod(this._daysSinceEpoch, 30)+1;
    }

    public get dayOfWeekName() {
        return CorneaDate.dayOfWeekNames[this.dayOfWeek-1];
    }

    public get dayOfWeek() {
        return mod(this._daysSinceEpoch, 6)+1;
    }

    public get weekName() {
        return CorneaDate.weekNames[this.week-1];
    }

    public get week() {
        return mod(Math.floor(this._daysSinceEpoch / 6), 5)+1;
    }

    public get monthName() {
        return CorneaDate.monthNames[this.month-1];
    }

    public get month() {
        return mod(Math.floor(this._daysSinceEpoch / 30), 5)+1;
    }

    public get moonYearName() {
        return CorneaDate.moonYearNames[this.moonYear-1];
    }

    public get moonYear() {
        return mod(Math.floor(this._daysSinceEpoch / 150), 4)+1;
    }

    public get sunYear() {
        return Math.floor(this._daysSinceEpoch / 600);
    }

    public toString() {
        return `${this.dayOfWeekName} ${this.day}.${this.month} ${this.moonYearName} ${this.sunYear}`;
    }

}
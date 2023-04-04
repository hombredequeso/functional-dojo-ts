
export class JustOne<T> {
  constructor(t: T) {
    this.value = t;
  }

  readonly value: T;

  map<T2>(f: (x: T) => T2): JustOne<T2>
  {
    const newValue = f(this.value);
    const result : JustOne<T2> =  new JustOne<T2>(newValue);
    return result;
  }

  flatMap<T2>(f: (x:T) => JustOne<T2>): JustOne<T2>
  {
    const newValue: JustOne<T2> = f(this.value);
    return newValue;
  }
}


export type JustOne<A> = {
  readonly value: A;
}

export const justOne: <A>(a: A) => JustOne<A> = (a: A) => ({
  value: a
})

export const map: <A,B>(f: (a: A) => B) => (justOneA: JustOne<A>) => JustOne<B> =
  (f: (a: A) => B) => (justOneA: JustOne<A>) =>
    ({
      value: f(justOneA.value)
    })

export const flatMap: <A,B>(f: (a: A) => JustOne<B>) => (justOneA: JustOne<A>) => JustOne<B> =
  <A,B>(f: (a: A) => JustOne<B>) => (justOneA: JustOne<A>) =>
    f(justOneA.value)

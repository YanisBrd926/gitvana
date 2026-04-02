declare module 'diff3' {
  interface OkBlock { ok: string[] }
  interface ConflictBlock { conflict: { a: string[]; aIndex: number; o: string[]; oIndex: number; b: string[]; bIndex: number } }
  type MergeResult = Array<OkBlock | ConflictBlock>;
  export default function diff3Merge(a: string[], o: string[], b: string[]): MergeResult;
}

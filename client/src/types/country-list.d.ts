declare module 'country-list' {
  export function getName(code: string): string;
  export function getCode(name: string): string;
  export function getNames(): Record<string, string>;
  export function getCodes(): Record<string, string>;
  export function getNameList(): string[];
  export function getCodeList(): string[];
  export function getData(): Array<{code: string, name: string}>;
}
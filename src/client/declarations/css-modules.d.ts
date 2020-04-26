interface IClassNames {
  [className: string]: string;
}

declare module '*.scss' {
  const classNames: IClassNames;
  export default classNames;
}

declare module '*.css' {
  const classNames: IClassNames;
  export default classNames;
}

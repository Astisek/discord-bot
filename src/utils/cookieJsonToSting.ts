interface ICookie {
  name: string;
  value: string;
}

// TODO: По идее не нужно
export const cookieJsonToSting = (jsonCookie: ICookie[]) =>
  jsonCookie.map(({ name, value }) => `${name}=${value}`).join('; ');

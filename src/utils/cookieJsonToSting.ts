interface ICookie {
  name: string;
  value: string;
}

export const cookieJsonToSting = (jsonCookie: ICookie[]) =>
  jsonCookie.map(({ name, value }) => `${name}=${value}`).join('; ');

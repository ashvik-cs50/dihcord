export const DEFAULT_AVATARS: readonly string[] = [
  "default-01.svg",
  "default-02.svg",
  "default-03.svg",
  "default-04.svg",
  "default-05.svg",
  "default-06.svg",
  "default-07.svg",
  "default-08.svg",
  "default-09.svg",
  "default-10.svg",
  "default-11.svg",
  "default-12.svg",
];

export function defaultAvatarUrl(key: string) {
  return `/avatars/${key}`;
}

export function randomDefaultAvatar() {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

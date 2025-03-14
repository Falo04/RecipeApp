export interface SimpleTag {
  uuid: string;
  name: string;
  color: TagColors;
}

export interface CreateOrUpdateTag {
  name: string;
  color: TagColors;
}

export enum TagColors {
  Red = "Red",
  Orange = "Orange",
  Amber = "Amber",
  Yellow = "Yellow",
  Lime = "Lime",
  Green = "Green",
  Emerald = "Emerald",
  Teal = "Teal",
  Cyan = "Cyan",
  Sky = "Sky",
  Blue = "Blue",
  Indigo = "Indigo",
  Violet = "Violet",
  Purple = "Purple",
  Fuchsia = "Fuchsia",
  Pink = "Pink",
  Rose = "Rose",
  Zinc = "Zinc",
}

export interface Company {
  name: string;
  slogan: string;
  activite: string;
  address: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  web: string;
  rccm: string;
  ninea: string;
  ifu: string;
  bank: string;
  bkName: string;
  iban: string;
  swift: string;
  compte: string;
}

export const DEFAULT_COMPANY: Company = {
  name: "KSY GLOBAL SERVICE",
  slogan: "KNOWLEDGE • SERVICE • YIELD",
  activite: "",
  address: "",
  city: "Dakar, Sénégal",
  phone: "",
  phone2: "",
  email: "",
  web: "",
  rccm: "",
  ninea: "",
  ifu: "",
  bank: "",
  bkName: "",
  iban: "",
  swift: "",
  compte: "",
};

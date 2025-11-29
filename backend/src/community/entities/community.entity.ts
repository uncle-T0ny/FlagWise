export class Community {
  id: string;
  rules: string[];

  constructor(id: string, rules?: string[]) {
    this.id = id;
    this.rules = rules || [];
  }
}

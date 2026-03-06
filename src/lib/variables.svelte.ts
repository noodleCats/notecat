import type { Variable } from "../types/variable";

class Variables {
  private target: Storage;
  public variables: Variable[];

  constructor(target: Storage) {
    this.target = target;
    this.variables = $state(this.getAllVariables());
  }

  get(name: string): string | null {
    return (
      this.variables.find((variable) => variable.name === name)?.value ?? null
    );
  }

  set(variable: Variable): void {
    this.target.setItem(`notecat:${variable.name}`, variable.value);
    this.variables.push(variable);
  }

  private getAllVariables(): Variable[] {
    let variables: Variable[] = [];

    const keys = Object.keys(this.target);
    for (const key of keys) {
      if (!key.startsWith("notecat:")) continue;

      variables.push({
        name: key.replace("notecat:", ""),
        value: this.target.getItem(key)!,
      });
    }

    return variables;
  }
}

const variables = {
  local: new Variables(localStorage),
  session: new Variables(sessionStorage),
};
export default variables;

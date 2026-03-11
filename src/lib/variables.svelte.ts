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
    if (variable.value !== null) {
      this.target.setItem(`notecat:${variable.name}`, variable.value);
    } else {
      this.target.removeItem(`notecat:${variable.name}`);
    }

    if (this.get(variable.name) === null) {
      this.variables.push(variable);
    } else {
      const index = this.variables.findIndex((v) => v.name === variable.name);
      if (index === -1) return;

      if (index !== 0) {
        this.variables.splice(index, 1);
        this.variables.unshift(variable);
      }
    }
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

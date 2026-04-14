interface Variable {
  name: string;
  value: string | null;
}

class Variables {
  private target: Storage;
  private variables: Variable[];

  constructor(target: Storage) {
    this.target = target;
    this.variables = this.getAllVariables();
  }

  get(name: string): string | null {
    return (
      this.variables.find((variable) => variable.name === name)?.value ?? null
    );
  }

  set(variable: Variable): void {
    const index = this.variables.findIndex((v) => v.name === variable.name);

    if (variable.value === null) {
      if (index !== -1) {
        this.variables.splice(index, 1);
      }
      this.target.removeItem(`notecat:${variable.name}`);
      return;
    }

    if (index === -1) {
      this.variables.push(variable);
    } else {
      this.variables[index] = variable;
    }

    this.target.setItem(`notecat:${variable.name}`, variable.value);
  }

  private getAllVariables(): Variable[] {
    const variables: Variable[] = [];

    const keys = Object.keys(this.target);
    for (const key of keys) {
      if (!key.startsWith("notecat:")) continue;

      variables.push({
        name: key.replace("notecat:", ""),
        value: this.target.getItem(key),
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

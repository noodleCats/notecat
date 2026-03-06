interface SessionVariable {
  name: string;
  value: string;
}

class Session {
  public variables: SessionVariable[];

  constructor() {
    this.variables = $state(this.retrieveVariables());
  }

  get(name: string): string | null {
    return (
      this.variables.find((variable) => variable.name === name)?.value ?? null
    );
  }

  set(variable: SessionVariable): void {
    sessionStorage.setItem(`notecat:${variable.name}`, variable.value);
    this.variables.push(variable);
  }

  private retrieveVariables(): SessionVariable[] {
    let variables: SessionVariable[] = [];

    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (!key.startsWith("notecat:")) continue;

      variables.push({
        name: key.replace("notecat:", ""),
        value: sessionStorage.getItem(key)!,
      });
    }

    return variables;
  }
}

const session = new Session();
export default session;

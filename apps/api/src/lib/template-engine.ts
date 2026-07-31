/**
 * A lightweight extensible template engine to render message templates
 * by replacing placeholders formatted as `{{variable_name}}` with values
 * from a provided context object.
 *
 * Missing or unknown keys in the context will leave their placeholder intact
 * (i.e. `{{variable}}` will remain as `{{variable}}`) allowing future variables
 * to be handled safely or preserved.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  if (!template) return "";
  
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? value : match;
  });
}

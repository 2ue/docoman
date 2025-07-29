declare module 'composerize' {
  /**
   * Convert a docker run command to a docker-compose.yml file
   * @param dockerCommand - The docker run command to convert
   * @returns The docker-compose.yml content as a string
   */
  function composerize(dockerCommand: string): string;
  export = composerize;
}
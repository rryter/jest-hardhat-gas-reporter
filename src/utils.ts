/**
 * Expresses gas usage as a nation-state currency price
 * @param  {Number} gas      gas used
 * @param  {Number} ethPrice e.g chf/eth
 * @param  {Number} gasPrice in wei e.g 5000000000 (5 gwei)
 * @return {Number}          cost of gas used (0.00)
 */
export function gasToCost(gas: number, ethPrice = 3000, gasPrice = 50) {
  ethPrice = parseFloat(ethPrice.toString());
  gasPrice = parseInt(gasPrice.toString());
  return (gasPrice / 1e9) * gas * ethPrice;
}

/**
 * Return true if transaction input and bytecode are same, ignoring library link code.
 * @param  {String} code
 * @return {Bool}
 */
export function matchBinaries(input: string, bytecode: string) {
  const regExp = bytecodeToBytecodeRegex(bytecode);
  return input.match(regExp) !== null;
}

/**
 * Generate a regular expression string which is library link agnostic so we can match
 * linked bytecode deployment transaction inputs to the evm.bytecode solc output.
 * @param  {String} bytecode
 * @return {String}
 */
export function bytecodeToBytecodeRegex(bytecode = "") {
  const bytecodeRegex = bytecode
    .replace(/__.{38}/g, ".{40}")
    .replace(/73f{40}/g, ".{42}");

  // HACK: Node regexes can't be longer that 32767 characters.
  // Contracts bytecode can. We just truncate the regexes. It's safe in practice.
  const MAX_REGEX_LENGTH = 32767;
  const truncatedBytecodeRegex = bytecodeRegex.slice(0, MAX_REGEX_LENGTH);
  return truncatedBytecodeRegex;
}
